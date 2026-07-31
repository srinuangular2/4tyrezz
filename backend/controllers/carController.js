const Car = require('../models/Car');
const Wishlist = require('../models/Wishlist');
const Lead = require('../models/Lead');

const POPULATE = [
  { path: 'brand', select: 'name slug logo' },
  { path: 'model', select: 'name slug' },
  { path: 'city', select: 'name state' },
  { path: 'owner', select: 'name mobile email dealershipName role' },
];

// GET /api/cars — list with search, filters, sort, pagination
exports.getCars = async (req, res) => {
  const {
    search, brand, model, city, fuel, transmission, bodyType,
    minPrice, maxPrice, minYear, maxYear, ownership,
    status, isFeatured, isPremium, sort = '-createdAt',
    page = 1, limit = 12,
  } = req.query;

  const filter = {};
  // Public listing pages only ever want approved cars; admin explicitly passes status.
  filter.status = status || 'approved';

  if (search) filter.$text = { $search: search };
  if (brand) filter.brand = brand;
  if (model) filter.model = model;
  if (city) filter.city = city;
  if (fuel) filter.fuel = fuel;
  if (transmission) filter.transmission = transmission;
  if (bodyType) filter.bodyType = bodyType;
  if (ownership) filter.ownership = ownership;
  if (isFeatured) filter.isFeatured = true;
  if (isPremium) filter.isPremium = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (minYear || maxYear) {
    filter.year = {};
    if (minYear) filter.year.$gte = Number(minYear);
    if (maxYear) filter.year.$lte = Number(maxYear);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [cars, total] = await Promise.all([
    Car.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(Number(limit)),
    Car.countDocuments(filter),
  ]);

  res.json({ cars, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getCarById = async (req, res) => {
  const car = await Car.findById(req.params.id).populate(POPULATE);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  car.views += 1;
  await car.save();
  res.json(car);
};

exports.getSimilarCars = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const similar = await Car.find({
    _id: { $ne: car._id }, status: 'approved',
    $or: [{ brand: car.brand }, { bodyType: car.bodyType }],
  }).limit(6).populate(POPULATE);
  res.json(similar);
};

exports.createCar = async (req, res) => {
  const images = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);
  const car = await Car.create({
    ...req.body,
    features: req.body.features ? JSON.parse(req.body.features) : [],
    images,
    owner: req.user._id,
    sellerType: req.user.role === 'dealer' ? 'dealer' : 'individual',
    status: 'pending', // every new listing needs admin approval
  });
  res.status(201).json(car);
};

exports.updateCar = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const isOwner = car.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to edit this listing' });
  }

  const newImages = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);
  const body = { ...req.body };
  if (body.features) body.features = JSON.parse(body.features);
  if (newImages.length) body.images = [...car.images, ...newImages];
  // Any edit by a non-admin sends the listing back for re-approval.
  if (req.user.role !== 'admin') body.status = 'pending';

  Object.assign(car, body);
  await car.save();
  res.json(car);
};

exports.deleteCar = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const isOwner = car.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this listing' });
  }
  await car.deleteOne();
  res.json({ success: true });
};

exports.myCars = async (req, res) => {
  const cars = await Car.find({ owner: req.user._id }).populate(POPULATE).sort('-createdAt');
  res.json(cars);
};

// ---- Wishlist ----
exports.toggleWishlist = async (req, res) => {
  const existing = await Wishlist.findOne({ user: req.user._id, car: req.params.carId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ wishlisted: false });
  }
  await Wishlist.create({ user: req.user._id, car: req.params.carId });
  res.json({ wishlisted: true });
};

exports.myWishlist = async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id }).populate({ path: 'car', populate: POPULATE });
  res.json(items.map((i) => i.car).filter(Boolean));
};

// ---- Leads ----
exports.createLead = async (req, res) => {
  const { carId, name, phone, message } = req.body;
  const car = await Car.findById(carId);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const lead = await Lead.create({ car: carId, seller: car.owner, name, phone, message });
  res.status(201).json(lead);
};

exports.myLeads = async (req, res) => {
  const leads = await Lead.find({ seller: req.user._id }).populate('car', 'title price images').sort('-createdAt');
  res.json(leads);
};
