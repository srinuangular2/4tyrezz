const Report = require('../models/Report');

exports.create = async (req, res) => {
  const { carId, reason, message } = req.body;
  if (!carId || !reason) return res.status(400).json({ message: 'carId and reason are required' });
  const report = await Report.create({
    car: carId,
    reporter: req.user?._id || null,
    reason,
    message,
  });
  res.status(201).json(report);
};

exports.list = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const reports = await Report.find(filter)
    .populate('car', 'title price')
    .populate('reporter', 'name mobile email')
    .sort('-createdAt');
  res.json(reports);
};

exports.markReviewed = async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, { status: 'reviewed' }, { new: true });
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json(report);
};
