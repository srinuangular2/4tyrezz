const User = require('../models/User');
const Car = require('../models/Car');
const Valuation = require('../models/Valuation');
const Enquiry = require('../models/Enquiry');
const DealerProfile = require('../models/DealerProfile');
const { syncFromListingStatus } = require('../utils/listingStatus');

exports.stats = async (req, res) => {
  const [totalCars, totalUsers, totalDealers, pendingApproval, activeListings, soldCars, pendingKyc, valuationQueries, financeEnquiries] = await Promise.all([
    Car.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'dealer' }),
    Car.countDocuments({ status: 'pending' }),
    Car.countDocuments({ status: 'approved' }),
    Car.countDocuments({ status: 'sold' }),
    DealerProfile.countDocuments({ kycStatus: { $in: ['PENDING_KYC_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'submitted', 'under_review'] } }),
    Valuation.countDocuments(),
    Enquiry.countDocuments({ type: { $in: ['finance', 'insurance'] } }),
  ]);

  // Last 6 months of listings, for the dashboard trend chart.
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  const monthly = await Car.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    totalCars,
    totalUsers,
    totalDealers,
    pendingApproval,
    activeListings,
    soldCars,
    pendingKyc,
    valuationQueries,
    financeEnquiries,
    monthly,
  });
};

exports.listUsers = async (req, res) => {
  const { role, search, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
    { mobile: new RegExp(search, 'i') },
  ];
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password -otp -otpExpires').sort('-createdAt').skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, isActive: user.isActive });
};

exports.setCarStatus = async (req, res) => {
  const { status } = req.body; // approved | rejected | pending | sold | PUBLISHED | ...
  const map = {
    approved: 'PUBLISHED',
    pending: 'PENDING_MODERATION',
    rejected: 'REJECTED',
    sold: 'SOLD',
    PUBLISHED: 'PUBLISHED',
    PENDING_MODERATION: 'PENDING_MODERATION',
    REJECTED: 'REJECTED',
    SOLD: 'SOLD',
  };
  const listingStatus = map[status];
  if (!listingStatus) return res.status(400).json({ message: 'Invalid status' });
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  Object.assign(car, syncFromListingStatus(listingStatus, car));
  await car.save();
  res.json(car);
};

exports.toggleCarFlag = async (req, res) => {
  const { field } = req.body; // 'isFeatured' | 'isPremium'
  if (!['isFeatured', 'isPremium'].includes(field)) return res.status(400).json({ message: 'Invalid field' });
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  car[field] = !car[field];
  await car.save();
  res.json(car);
};
