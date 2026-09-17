const mongoose = require('mongoose');
const Car = require('../models/Car');
const UserViewHistory = require('../models/UserViewHistory');

const MAX = 8;
const CAR_POPULATE = [
  { path: 'brand', select: 'name' },
  { path: 'model', select: 'name' },
  { path: 'city', select: 'name' },
];

function titleOf(car) {
  return (
    car.title ||
    [car.year, car.brand?.name || car.brand, car.model?.name || car.model, car.variant]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Used car'
  );
}

function cityOf(car) {
  return (
    [car.location?.area, car.location?.city || car.city?.name || car.cityName].filter(Boolean).join(', ') ||
    car.city?.name ||
    car.city ||
    ''
  );
}

function snapshotFromCar(car) {
  return {
    title: titleOf(car),
    price: car.price ?? null,
    thumb: car.images?.[0] || car.photos?.[0] || '',
    km: car.kmDriven ?? car.km ?? null,
    fuel: car.fuel || '',
    transmission: car.transmission || '',
    city: cityOf(car),
  };
}

function mapRow(row, car) {
  const live = car && typeof car === 'object' && car._id ? snapshotFromCar(car) : null;
  const snap = row.snapshot || {};
  const vehicleId = String(car?._id || row.vehicle?._id || row.vehicle || '');
  if (!vehicleId) return null;
  return {
    id: vehicleId,
    title: live?.title || snap.title || 'Used car',
    price: live?.price ?? snap.price,
    thumb: live?.thumb || snap.thumb || '',
    km: live?.km ?? snap.km,
    fuel: live?.fuel || snap.fuel || '',
    transmission: live?.transmission || snap.transmission || '',
    city: live?.city || snap.city || '',
    viewedAt: row.viewedAt,
  };
}

exports.listMine = async (req, res) => {
  const rows = await UserViewHistory.find({ user: req.user._id })
    .sort('-viewedAt')
    .limit(MAX)
    .populate({ path: 'vehicle', populate: CAR_POPULATE })
    .lean();
  const data = rows.map((row) => mapRow(row, row.vehicle)).filter(Boolean);
  res.json({ data });
};

exports.recordView = async (req, res) => {
  const vehicleId = req.body.vehicleId || req.body.carId || req.body.id;
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    return res.status(400).json({ message: 'Valid vehicle id required' });
  }
  const car = await Car.findById(vehicleId).populate(CAR_POPULATE);
  if (!car) return res.status(404).json({ message: 'Vehicle not found' });

  const snapshot = snapshotFromCar(car);
  const doc = await UserViewHistory.findOneAndUpdate(
    { user: req.user._id, vehicle: car._id },
    { $set: { viewedAt: new Date(), snapshot, user: req.user._id, vehicle: car._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const extras = await UserViewHistory.find({ user: req.user._id }).sort('-viewedAt').skip(MAX).select('_id');
  if (extras.length) {
    await UserViewHistory.deleteMany({ _id: { $in: extras.map((e) => e._id) } });
  }

  res.json({ data: mapRow(doc.toObject(), car) });
};
