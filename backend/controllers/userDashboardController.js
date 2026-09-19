const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Enquiry = require('../models/Enquiry');
const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const User = require('../models/User');
const Valuation = require('../models/Valuation');
const { Order, Wishlist, UserActivity, GarageVehicle, recordActivity } = require('../models/UserDashboard');
const { validateEmail, validateMobile, validatePincode } = require('../utils/kycValidators');

const CAR_POPULATE = [
  { path: 'brand', select: 'name logo' },
  { path: 'model', select: 'name' },
  { path: 'city', select: 'name' },
];

const DEFAULT_CONSENTS = {
  whatsappUpdates: false,
  marketingSms: false,
  dataSharing: false,
  wishlistPriceDrop: true,
  wishlistAvailability: true,
};

function listingStatus(car, leadCount = 0) {
  if (car.status === 'sold') return 'Sold';
  if (car.status === 'rejected') return 'Rejected';
  if (car.status === 'pending') return 'In Review';
  if (car.status === 'approved' && leadCount > 0) return 'Active Bids';
  if (car.status === 'approved') return 'Verified';
  return car.status || 'In Review';
}

exports.listOrders = async (req, res) => {
  const userId = req.user._id;
  const [stored, bookings, valuations, inspections] = await Promise.all([
    Order.find({ user: userId }).sort('-createdAt').limit(50).lean(),
    Booking.find({ user: userId }).sort('-createdAt').limit(50).populate('vehicle', 'title images price').lean(),
    Valuation.find({ user: userId }).sort('-createdAt').limit(50).lean(),
    Enquiry.find({ user: userId, inspectionType: { $nin: ['', null] } }).sort('-createdAt').limit(50).lean(),
  ]);

  const mapped = [
    ...stored.map((o) => ({
      id: o._id,
      type: o.type,
      title: o.title,
      status: o.status,
      amount: o.amount,
      refId: o.refId,
      createdAt: o.createdAt,
      vehicle: o.vehicle,
      source: 'order',
    })),
    ...bookings.map((b) => ({
      id: b._id,
      type: b.status === 'Payment Pending' ? 'token_payment' : 'purchase',
      title: b.vehicle?.title || 'Car booking',
      status: b.status,
      amount: b.amount,
      refId: b.bookingRef,
      createdAt: b.createdAt,
      vehicle: b.vehicle,
      source: 'booking',
    })),
    ...valuations.map((v) => ({
      id: v._id,
      type: 'evaluation',
      title: [v.brand, v.model, v.year].filter(Boolean).join(' ') || 'Valuation request',
      status: v.estimate ? 'Completed' : 'Requested',
      amount: v.estimate || null,
      refId: String(v._id).slice(-8).toUpperCase(),
      createdAt: v.createdAt,
      source: 'valuation',
    })),
    ...inspections.map((e) => ({
      id: e._id,
      type: 'inspection',
      title: [e.brand, e.model].filter(Boolean).join(' ') || 'Inspection booking',
      status: e.status,
      amount: null,
      refId: String(e._id).slice(-8).toUpperCase(),
      createdAt: e.createdAt,
      source: 'enquiry',
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: mapped });
};

exports.listWishlist = async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .sort('-createdAt')
    .populate({ path: 'car', populate: CAR_POPULATE })
    .lean();
  res.json({ success: true, data: items.map((i) => i.car).filter(Boolean) });
};

exports.toggleWishlist = async (req, res) => {
  const carId = req.body.carId || req.body.car || req.params.carId;
  if (!carId) return res.status(400).json({ message: 'carId is required' });
  const existing = await Wishlist.findOne({ user: req.user._id, car: carId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, wishlisted: false });
  }
  await Wishlist.create({ user: req.user._id, car: carId });
  await recordActivity(req.user._id, { type: 'wishlist', title: 'Saved a vehicle', link: `/cars/${carId}` });
  res.json({ success: true, wishlisted: true });
};

exports.listActivity = async (req, res) => {
  const userId = req.user._id;
  const [stored, drives, valuations, enquiries] = await Promise.all([
    UserActivity.find({ user: userId }).sort('-createdAt').limit(80).lean(),
    TestDrive.find({ user: userId }).sort('-createdAt').limit(40).populate('vehicle', 'title').lean(),
    Valuation.find({ user: userId }).sort('-createdAt').limit(40).lean(),
    Enquiry.find({ user: userId }).sort('-createdAt').limit(40).lean(),
  ]);

  const live = [
    ...drives.map((d) => ({
      id: d._id,
      type: 'test_drive',
      title: `Test drive ${d.status?.toLowerCase() || 'requested'}`,
      body: d.vehicle?.title || d.location || '',
      createdAt: d.createdAt,
      link: '/profile/activity',
    })),
    ...valuations.map((v) => ({
      id: v._id,
      type: 'valuation',
      title: 'Valuation query',
      body: [v.brand, v.model, v.year].filter(Boolean).join(' '),
      createdAt: v.createdAt,
      link: '/valuation',
    })),
    ...enquiries.map((e) => ({
      id: e._id,
      type: 'enquiry',
      title: `Dealer enquiry · ${e.type}`,
      body: e.message || [e.brand, e.model].filter(Boolean).join(' '),
      createdAt: e.createdAt,
      link: '/profile/activity',
    })),
  ];

  const storedMapped = stored.map((a) => ({
    id: a._id,
    type: a.type,
    title: a.title,
    body: a.body,
    createdAt: a.createdAt,
    link: a.link,
  }));

  const data = [...storedMapped, ...live]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 80);

  res.json({ success: true, data });
};

exports.listGarage = async (req, res) => {
  const data = await GarageVehicle.find({ user: req.user._id, status: { $ne: 'archived' } }).sort('-createdAt');
  res.json({ success: true, data });
};

exports.addGarage = async (req, res) => {
  const { brand, model, variant, year, registrationNumber, fuel, lastServiceAt, lastServiceNotes, rtoNotes, insuranceExpiry } = req.body;
  if (!brand || !model) return res.status(400).json({ message: 'Brand and model are required' });
  const row = await GarageVehicle.create({
    user: req.user._id,
    brand,
    model,
    variant,
    year: year ? Number(year) : null,
    registrationNumber,
    fuel,
    lastServiceAt: lastServiceAt || null,
    lastServiceNotes,
    rtoNotes,
    insuranceExpiry: insuranceExpiry || null,
  });
  await recordActivity(req.user._id, { type: 'garage', title: `Added ${brand} ${model} to garage` });
  res.status(201).json({ success: true, data: row });
};

exports.updateGarage = async (req, res) => {
  const row = await GarageVehicle.findOne({ _id: req.params.id, user: req.user._id });
  if (!row) return res.status(404).json({ message: 'Vehicle not found' });
  const allowed = ['brand', 'model', 'variant', 'year', 'registrationNumber', 'fuel', 'lastServiceAt', 'lastServiceNotes', 'rtoNotes', 'insuranceExpiry', 'status'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) row[k] = req.body[k];
  });
  await row.save();
  res.json({ success: true, data: row });
};

exports.removeGarage = async (req, res) => {
  const row = await GarageVehicle.findOne({ _id: req.params.id, user: req.user._id });
  if (!row) return res.status(404).json({ message: 'Vehicle not found' });
  row.status = 'archived';
  await row.save();
  res.json({ success: true });
};

exports.listMyVehicles = async (req, res) => {
  const cars = await Car.find({ owner: req.user._id })
    .sort('-createdAt')
    .populate('brand model city')
    .lean();
  const ids = cars.map((c) => c._id);
  const leads = await Lead.aggregate([
    { $match: { car: { $in: ids } } },
    { $group: { _id: '$car', count: { $sum: 1 } } },
  ]);
  const leadMap = Object.fromEntries(leads.map((l) => [String(l._id), l.count]));
  const data = cars.map((c) => ({
    ...c,
    liveStatus: listingStatus(c, leadMap[String(c._id)] || 0),
    bidCount: leadMap[String(c._id)] || 0,
  }));
  res.json({ success: true, data });
};

exports.getConsents = async (req, res) => {
  res.json({ success: true, data: { ...DEFAULT_CONSENTS, ...(req.user.consents || {}) } });
};

exports.updateConsents = async (req, res) => {
  const next = { ...DEFAULT_CONSENTS, ...(req.user.consents || {}) };
  ['whatsappUpdates', 'marketingSms', 'dataSharing', 'wishlistPriceDrop', 'wishlistAvailability'].forEach((k) => {
    if (req.body[k] !== undefined) next[k] = Boolean(req.body[k]);
  });
  req.user.consents = next;
  await req.user.save();
  res.json({ success: true, data: next });
};

exports.listAddresses = async (req, res) => {
  res.json({ success: true, data: req.user.addresses || [] });
};

exports.addAddress = async (req, res) => {
  const { label, line1, line2, city, state, pincode, isDefault } = req.body;
  if (!line1 || !city) return res.status(400).json({ message: 'Address line and city are required' });
  if (pincode) {
    const pin = validatePincode(pincode);
    if (!pin.ok) return res.status(400).json({ message: pin.message });
  }
  const addresses = req.user.addresses || [];
  if (isDefault) addresses.forEach((a) => { a.isDefault = false; });
  addresses.push({ label, line1, line2, city, state, pincode, isDefault: Boolean(isDefault) || addresses.length === 0 });
  req.user.addresses = addresses;
  await req.user.save();
  res.status(201).json({ success: true, data: req.user.addresses });
};

exports.updateAddress = async (req, res) => {
  const addr = (req.user.addresses || []).id(req.params.id);
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  ['label', 'line1', 'line2', 'city', 'state', 'pincode', 'isDefault'].forEach((k) => {
    if (req.body[k] !== undefined) addr[k] = req.body[k];
  });
  if (addr.isDefault) {
    req.user.addresses.forEach((a) => {
      if (String(a._id) !== String(addr._id)) a.isDefault = false;
    });
  }
  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
};

exports.removeAddress = async (req, res) => {
  req.user.addresses = (req.user.addresses || []).filter((a) => String(a._id) !== req.params.id);
  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
};

exports.updateSettings = async (req, res) => {
  const { name, email, city } = req.body;
  if (name !== undefined) req.user.name = String(name).trim();
  if (city !== undefined) req.user.city = String(city).trim();
  if (email !== undefined) {
    const check = validateEmail(email);
    if (email && !check.ok) return res.status(400).json({ message: check.message });
    if (check.value) {
      const existing = await User.findOne({ email: check.value, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      req.user.email = check.value;
    }
  }
  if (req.body.mobile !== undefined) {
    const check = validateMobile(req.body.mobile);
    if (!check.ok) return res.status(400).json({ message: check.message });
    const existing = await User.findOne({ mobile: check.value, _id: { $ne: req.user._id } });
    if (existing) return res.status(400).json({ message: 'Mobile already in use' });
    req.user.mobile = check.value;
  }
  if (req.user.name && (req.user.email || req.user.mobile)) req.user.profileComplete = true;
  await req.user.save();
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      mobile: req.user.mobile,
      email: req.user.email,
      role: req.user.role,
      city: req.user.city,
      avatar: req.user.avatar,
      profileComplete: req.user.profileComplete,
      consents: req.user.consents,
      addresses: req.user.addresses,
    },
  });
};
