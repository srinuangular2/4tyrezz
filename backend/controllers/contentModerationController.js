const Car = require('../models/Car');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const { syncFromListingStatus } = require('../utils/listingStatus');

let Report;
try {
  Report = require('../models/Report');
} catch {
  Report = null;
}

const POPULATE = [
  { path: 'brand', select: 'name' },
  { path: 'model', select: 'name' },
  { path: 'city', select: 'name state' },
  { path: 'owner', select: 'name dealershipName email mobile' },
];

function priceSanity(car) {
  const ask = Number(car.price);
  const min = Number(car.quickInsights?.marketPriceMin);
  const max = Number(car.quickInsights?.marketPriceMax);
  if (!ask || !min || !max) return { label: 'No market band', tone: 'neutral' };
  if (ask < min) return { label: 'Below market', tone: 'good' };
  if (ask <= max) return { label: 'Within market', tone: 'fair' };
  return { label: 'Above market', tone: 'warn' };
}

function serialize(car) {
  const obj = car.toObject ? car.toObject() : car;
  return { ...obj, priceSanity: priceSanity(obj) };
}

exports.queue = async (req, res) => {
  const filter = {
    $or: [{ listingStatus: 'PENDING_MODERATION' }, { status: 'pending' }],
  };
  if (req.query.q) filter.title = new RegExp(req.query.q, 'i');
  const data = await Car.find(filter).populate(POPULATE).sort('-updatedAt').limit(100);
  res.json({ success: true, data: data.map(serialize) });
};

exports.approve = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Listing not found' });
  Object.assign(car, syncFromListingStatus('PUBLISHED', car));
  car.moderationNotes = '';
  await car.save();
  if (car.owner) {
    await Notification.create({
      user: car.owner,
      title: 'Listing approved',
      body: `${car.title} is now live on 4TYREZZ`,
      type: 'approval',
      link: `/cars/${car._id}`,
    });
  }
  res.json({ success: true, data: serialize(car) });
};

exports.reject = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Listing not found' });
  const notes = req.body.remarks || req.body.reason || req.body.moderationNotes || 'Rejected by moderation';
  Object.assign(car, syncFromListingStatus('REJECTED', car));
  car.moderationNotes = notes;
  await car.save();
  if (car.owner) {
    await Notification.create({
      user: car.owner,
      title: 'Listing needs changes',
      body: notes,
      type: 'approval',
      link: `/cars/${car._id}`,
    });
  }
  res.json({ success: true, data: serialize(car) });
};

exports.flagged = async (_req, res) => {
  const reviews = await Review.find({ status: 'pending' })
    .populate('user', 'name')
    .populate('vehicle', 'title')
    .sort('-createdAt')
    .limit(50)
    .lean();
  let reports = [];
  if (Report) {
    reports = await Report.find({ status: 'open' })
      .populate('car', 'title images')
      .populate('reporter', 'name email mobile')
      .sort('-createdAt')
      .limit(50)
      .lean();
  }
  res.json({ data: { reviews, reports } });
};
