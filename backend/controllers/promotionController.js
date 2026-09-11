const Promotion = require('../models/Promotion');

exports.list = async (req, res) => {
  const filter = {};
  if (!req.user || req.user.role !== 'admin') {
    filter.isActive = true;
    const now = new Date();
    filter.$and = [
      { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
    ];
  }
  const data = await Promotion.find(filter).sort('-createdAt').limit(50);
  res.json({ data });
};

exports.create = async (req, res) => {
  const doc = await Promotion.create(req.body);
  res.status(201).json({ data: doc });
};

exports.update = async (req, res) => {
  const doc = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ data: doc });
};

exports.remove = async (req, res) => {
  await Promotion.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
