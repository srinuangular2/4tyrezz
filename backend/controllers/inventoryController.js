const Car = require('../models/Car');
const Notification = require('../models/Notification');
const { dispatchSafe, EVENTS } = require('../services/notifyService');
const buyerAlerts = require('../services/buyerAlertService');
const {
  listingFieldsForCreate,
  syncFromListingStatus,
  displayListingStatus,
  scopedDealerId,
  requiresListingModeration,
} = require('../utils/listingStatus');

const POPULATE = [
  { path: 'brand', select: 'name slug logo' },
  { path: 'model', select: 'name slug' },
  { path: 'city', select: 'name state' },
];

async function notifyAdmins({ title, body, link, meta = {} }) {
  await dispatchSafe({
    event: EVENTS.NEW_LISTING_MODERATION,
    title: title || 'Listing pending moderation',
    message: body || 'A vehicle was submitted for approval',
    adminLink: link || '/listings/moderation',
    dealerId: meta.dealerId,
    entityId: meta.carId,
    meta,
    adminOnly: true,
  });
}

function serializeListing(car) {
  const obj = car.toObject ? car.toObject() : car;
  return {
    ...obj,
    listingStatus: displayListingStatus(obj),
    isPublished: displayListingStatus(obj) === 'PUBLISHED' && !obj.unpublished,
  };
}

exports.list = async (req, res) => {
  const owner = scopedDealerId(req);
  const filter = { owner };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.listingStatus) filter.listingStatus = req.query.listingStatus;
  if (req.query.availability) filter.availability = req.query.availability;
  if (req.query.search) {
    filter.title = new RegExp(String(req.query.search).trim(), 'i');
  }
  const cars = await Car.find(filter).populate(POPULATE).sort('-updatedAt').lean();
  res.json({ success: true, data: cars.map(serializeListing) });
};

exports.patchListing = async (req, res) => {
  const owner = scopedDealerId(req);
  const car = await Car.findOne({ _id: req.params.id, owner });
  if (!car) return res.status(404).json({ message: 'Listing not found' });
  const previousPrice = Number(car.price);
  const previousAvail = car.availability;
  const previousUnpublished = Boolean(car.unpublished);

  const allowed = [
    'price',
    'availability',
    'pickupLocation',
    'videoUrl',
    'interiorColor',
    'color',
    'kmDriven',
    'description',
    'unpublished',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) car[key] = req.body[key];
  });

  if (req.body.price != null && Number(req.body.price) !== previousPrice) {
    car.priceHistory = car.priceHistory || [];
    car.priceHistory.push({
      price: Number(req.body.price),
      changedAt: new Date(),
      reason: req.body.reason || 'quick_price_update',
    });
    car.price = Number(req.body.price);
  }

  if (req.user.role !== 'admin' && requiresListingModeration() && req.body.price != null) {
    Object.assign(car, syncFromListingStatus('PENDING_MODERATION', car));
    await notifyAdmins({
      title: 'Listing needs re-approval',
      body: `${car.title} was updated and is pending moderation`,
      link: '/approvals',
      meta: { carId: car._id, dealerId: owner },
    });
  }

  await car.save();
  const populated = await Car.findById(car._id).populate(POPULATE);
  if (Number(car.price) !== previousPrice) {
    buyerAlerts.onPriceChange(populated, previousPrice);
  }
  if (Boolean(car.unpublished) !== previousUnpublished || car.availability !== previousAvail) {
    buyerAlerts.onAvailabilityChange(populated, { reason: car.unpublished ? 'unpublished' : car.availability });
  }
  res.json({ success: true, data: serializeListing(populated) });
};

exports.togglePublish = async (req, res) => {
  const owner = scopedDealerId(req);
  const car = await Car.findOne({ _id: req.params.id, owner });
  if (!car) return res.status(404).json({ message: 'Listing not found' });
  const publish = req.body.publish !== false && req.body.unpublished !== true;
  if (!publish) {
    Object.assign(car, syncFromListingStatus('UNPUBLISHED', car));
  } else if (car.listingStatus === 'PUBLISHED' || car.status === 'approved') {
    Object.assign(car, syncFromListingStatus('PUBLISHED', car));
  } else if (requiresListingModeration()) {
    Object.assign(car, syncFromListingStatus('PENDING_MODERATION', car));
    await notifyAdmins({
      title: 'Listing submitted for approval',
      body: `${car.title} is waiting for publish approval`,
      link: '/approvals',
      meta: { carId: car._id, dealerId: owner },
    });
  } else {
    Object.assign(car, syncFromListingStatus('PUBLISHED', car));
  }
  await car.save();
  if (!publish) buyerAlerts.onAvailabilityChange(car, { reason: 'unpublished' });
  else if (car.status === 'approved' && !car.unpublished) buyerAlerts.onListingPublished(car);
  res.json({ success: true, data: serializeListing(car) });
};

exports.markSold = async (req, res) => {
  const owner = scopedDealerId(req);
  const car = await Car.findOne({ _id: req.params.id, owner });
  if (!car) return res.status(404).json({ message: 'Listing not found' });
  Object.assign(car, syncFromListingStatus('SOLD', car));
  car.availability = 'unavailable';
  await car.save();
  buyerAlerts.onAvailabilityChange(car, { reason: 'sold' });
  res.json({ success: true, data: serializeListing(car) });
};

exports.updatePrice = async (req, res) => {
  req.body.reason = req.body.reason || 'quick_price_update';
  return exports.patchListing(req, res);
};

exports.updateAvailability = async (req, res) => {
  return exports.patchListing(req, res);
};

exports.remove = async (req, res) => {
  const owner = scopedDealerId(req);
  const car = await Car.findOne({ _id: req.params.id, owner });
  if (!car) return res.status(404).json({ message: 'Listing not found' });
  await car.deleteOne();
  res.json({ success: true });
};

exports.bulkActions = async (req, res) => {
  const owner = scopedDealerId(req);
  const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id) => /^[a-fA-F0-9]{24}$/.test(String(id))) : [];
  if (!ids.length) return res.status(400).json({ message: 'Select at least one listing' });
  const action = req.body.action;
  const cars = await Car.find({ _id: { $in: ids }, owner });
  if (!cars.length) return res.status(404).json({ message: 'No matching listings' });

  if (action === 'delete') {
    await Car.deleteMany({ _id: { $in: cars.map((c) => c._id) }, owner });
    return res.json({ success: true, updated: cars.length });
  }

  for (const car of cars) {
    const previousPrice = Number(car.price);
    if (action === 'unpublish') Object.assign(car, syncFromListingStatus('UNPUBLISHED', car));
    if (action === 'publish') {
      if (requiresListingModeration() && car.status !== 'approved') {
        Object.assign(car, syncFromListingStatus('PENDING_MODERATION', car));
      } else {
        Object.assign(car, syncFromListingStatus('PUBLISHED', car));
      }
    }
    if (action === 'sold') Object.assign(car, syncFromListingStatus('SOLD', car));
    if (action === 'price') {
      const mode = req.body.mode === 'percent' ? 'percent' : 'amount';
      const delta = Number(req.body.value);
      if (!Number.isFinite(delta)) continue;
      const next = mode === 'percent' ? Math.round(car.price * (1 + delta / 100)) : Math.round(car.price + delta);
      if (next > 0) {
        car.priceHistory.push({ price: next, changedAt: new Date(), reason: 'bulk_price' });
        car.price = next;
        if (requiresListingModeration()) Object.assign(car, syncFromListingStatus('PENDING_MODERATION', car));
      }
    }
    await car.save();
    if (action === 'price' && Number(car.price) !== previousPrice) buyerAlerts.onPriceChange(car, previousPrice);
    if (action === 'sold' || action === 'unpublish') buyerAlerts.onAvailabilityChange(car, { reason: action });
    if (action === 'publish' && car.status === 'approved' && !car.unpublished) buyerAlerts.onListingPublished(car);
  }

  res.json({ success: true, updated: cars.length });
};

exports.moderate = async (req, res) => {
  const decision = String(req.body.status || req.body.decision || '').toUpperCase();
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Listing not found' });
  if (decision === 'PUBLISHED' || decision === 'APPROVED') {
    Object.assign(car, syncFromListingStatus('PUBLISHED', car));
  } else if (decision === 'REJECTED') {
    Object.assign(car, syncFromListingStatus('REJECTED', car));
  } else if (decision === 'PENDING_MODERATION' || decision === 'PENDING') {
    Object.assign(car, syncFromListingStatus('PENDING_MODERATION', car));
  } else {
    return res.status(400).json({ message: 'status must be PUBLISHED, REJECTED or PENDING_MODERATION' });
  }
  await car.save();
  if (car.owner) {
    await Notification.create({
      user: car.owner,
      title: car.listingStatus === 'PUBLISHED' ? 'Listing approved' : 'Listing update',
      body: `${car.title} is now ${car.listingStatus}`,
      type: 'approval',
      link: `/cars/${car._id}`,
      meta: { carId: car._id },
    });
  }
  if (car.listingStatus === 'PUBLISHED') buyerAlerts.onListingPublished(car);
  if (car.listingStatus === 'REJECTED' || car.listingStatus === 'UNPUBLISHED') {
    buyerAlerts.onAvailabilityChange(car, { reason: car.listingStatus.toLowerCase() });
  }
  res.json({ success: true, data: serializeListing(car) });
};

exports.moderationQueue = async (_req, res) => {
  const cars = await Car.find({
    $or: [{ listingStatus: 'PENDING_MODERATION' }, { status: 'pending' }],
  })
    .populate(POPULATE)
    .populate('owner', 'name dealershipName email mobile')
    .sort('-updatedAt')
    .lean();
  res.json({ success: true, data: cars.map(serializeListing) });
};

exports.notifyOnCreateOrUpdate = notifyAdmins;
exports.listingFieldsForCreate = listingFieldsForCreate;
exports.serializeListing = serializeListing;
