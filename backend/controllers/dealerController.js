const User = require('../models/User');
const Car = require('../models/Car');
const Review = require('../models/Review');
const DealerProfile = require('../models/DealerProfile');
const { publicListingFilter } = require('../utils/listingStatus');

exports.listDealers = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);
  const filter = { role: 'dealer', isActive: true };
  if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { dealershipName: new RegExp(req.query.search, 'i') },
    ];
  }

  const [total, dealers] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('name dealershipName city avatar createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const ids = dealers.map((d) => d._id);
  const counts = await Car.aggregate([
    { $match: { owner: { $in: ids }, ...publicListingFilter() } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  const ratings = await Review.aggregate([
    { $match: { dealer: { $in: ids }, status: 'approved' } },
    { $group: { _id: '$dealer', avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  const ratingMap = Object.fromEntries(
    ratings.map((r) => [String(r._id), { rating: Number(r.avg.toFixed(1)), reviews: r.n }])
  );

  const data = dealers.map((d) => ({
    id: d._id,
    name: d.dealershipName || d.name,
    contactName: d.name,
    city: d.city,
    avatar: d.avatar,
    inventory: countMap[String(d._id)] || 0,
    rating: ratingMap[String(d._id)]?.rating || null,
    reviews: ratingMap[String(d._id)]?.reviews || 0,
    badge: (countMap[String(d._id)] || 0) >= 20 ? 'Verified Dealer' : 'Partner',
  }));

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
};

exports.getDealer = async (req, res) => {
  if (!/^[a-fA-F0-9]{24}$/.test(String(req.params.id || ''))) {
    return res.status(404).json({ message: 'Dealer not found' });
  }
  try {
  const dealer = await User.findOne({
    _id: req.params.id,
    role: 'dealer',
    isActive: true,
  })
    .select('name dealershipName city avatar createdAt mobile email')
    .lean();
  if (!dealer) return res.status(404).json({ message: 'Dealer not found' });

  const inventory = await Car.find({ owner: dealer._id, ...publicListingFilter() })
    .populate('brand model city')
    .sort('-createdAt')
    .limit(24)
    .lean();

  const ratingAgg = await Review.aggregate([
    { $match: { dealer: dealer._id, status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);

  const reviews = await Review.find({ dealer: dealer._id, status: 'approved' })
    .populate('user', 'name')
    .sort('-createdAt')
    .limit(12)
    .lean();

  const profile = await DealerProfile.findOne({ user: dealer._id }).lean();
  const verified = Boolean(profile?.kycVerified || profile?.kycStatus === 'approved');

  res.json({
    data: {
      id: dealer._id,
      name: profile?.businessName || dealer.dealershipName || dealer.name,
      contactName: dealer.name,
      city: profile?.city || dealer.city,
      state: profile?.state || '',
      address: [profile?.addressLine1, profile?.addressLine2, profile?.city, profile?.state, profile?.pincode]
        .filter(Boolean)
        .join(', '),
      avatar: dealer.avatar,
      phone: dealer.mobile,
      email: dealer.email,
      about: profile?.about || '',
      operatingHours: profile?.operatingHours || {},
      geo: profile?.geo || {},
      googlePlaceId: profile?.googlePlaceId || '',
      verified,
      badge: verified ? 'Verified Dealer' : 'Partner',
      inventoryCount: inventory.length,
      rating: ratingAgg[0] ? Number(ratingAgg[0].avg.toFixed(1)) : null,
      reviewCount: ratingAgg[0]?.n || 0,
      reviews,
      cars: inventory,
    },
  });
  } catch (err) {
    return res.status(404).json({ message: 'Dealer not found' });
  }
};
