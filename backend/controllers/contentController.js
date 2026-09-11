const { FAQ, Testimonial, SiteStat } = require('../models/Content');

const paginate = (query, { page = 1, limit = 20 }) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { skip: (p - 1) * l, limit: l, page: p };
};

exports.listFaqs = async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { isActive: true };
  const items = await FAQ.find(filter).sort('sortOrder createdAt').lean();
  res.json({ data: items });
};

exports.upsertFaq = async (req, res) => {
  const { id, question, answer, category, sortOrder, isActive } = req.body;
  let doc;
  if (id) {
    doc = await FAQ.findByIdAndUpdate(
      id,
      { question, answer, category, sortOrder, isActive },
      { new: true }
    );
  } else {
    doc = await FAQ.create({ question, answer, category, sortOrder, isActive });
  }
  res.json({ data: doc });
};

exports.deleteFaq = async (req, res) => {
  await FAQ.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.listTestimonials = async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { isActive: true };
  const items = await Testimonial.find(filter).sort('sortOrder createdAt').lean();
  res.json({ data: items });
};

exports.upsertTestimonial = async (req, res) => {
  const { id, name, role, text, rating, avatar, sortOrder, isActive } = req.body;
  let doc;
  if (id) {
    doc = await Testimonial.findByIdAndUpdate(
      id,
      { name, role, text, rating, avatar, sortOrder, isActive },
      { new: true }
    );
  } else {
    doc = await Testimonial.create({ name, role, text, rating, avatar, sortOrder, isActive });
  }
  res.json({ data: doc });
};

exports.deleteTestimonial = async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.listStats = async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { isActive: true };
  const items = await SiteStat.find(filter).sort('sortOrder').lean();
  res.json({ data: items });
};

exports.upsertStat = async (req, res) => {
  const { id, key, label, value, sortOrder, isActive } = req.body;
  let doc;
  if (id) {
    doc = await SiteStat.findByIdAndUpdate(id, { key, label, value, sortOrder, isActive }, { new: true });
  } else {
    doc = await SiteStat.create({ key, label, value, sortOrder, isActive });
  }
  res.json({ data: doc });
};

module.exports.paginate = paginate;
