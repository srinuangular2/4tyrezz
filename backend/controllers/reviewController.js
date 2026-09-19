const Review = require('../models/Review');

exports.create = async (req, res) => {
  const { dealerId, vehicleId, rating, title, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ message: 'rating and comment required' });

  const doc = await Review.create({
    user: req.user._id,
    dealer: dealerId,
    vehicle: vehicleId,
    rating,
    title,
    comment,
    status: 'pending',
  });
  res.status(201).json({ data: doc });
};

exports.list = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.dealer && (req.user?.role === 'admin' || req.user?.role === 'super_admin')) {
    filter.dealer = req.query.dealer;
  }
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  if (req.user?.role === 'admin' && req.query.status) filter.status = req.query.status;
  else if (!req.user || req.user.role !== 'admin') filter.status = 'approved';

  const [total, data] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .populate('user', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    data: (req.user?.role === 'admin' || req.user?.role === 'super_admin')
      ? data
      : data.map((row) => {
        const obj = row.toObject ? row.toObject() : { ...row };
        delete obj.dealer;
        return obj;
      }),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
};

exports.moderate = async (req, res) => {
  const doc = await Review.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ data: doc });
};
