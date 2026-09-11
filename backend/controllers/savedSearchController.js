const SavedSearch = require('../models/SavedSearch');

exports.list = async (req, res) => {
  const data = await SavedSearch.find({ user: req.user._id }).sort('-createdAt');
  res.json({ data });
};

function anyAlerts(body, fallback = {}) {
  const email = body.emailAlerts !== undefined ? !!body.emailAlerts : !!fallback.emailAlerts;
  const whatsapp = body.whatsappAlerts !== undefined ? !!body.whatsappAlerts : !!fallback.whatsappAlerts;
  const neu = body.newMatchAlerts !== undefined ? !!body.newMatchAlerts : !!fallback.newMatchAlerts;
  const price = body.priceChangeAlerts !== undefined ? !!body.priceChangeAlerts : !!fallback.priceChangeAlerts;
  return email || whatsapp || neu || price;
}

exports.create = async (req, res) => {
  const newMatchAlerts = req.body.newMatchAlerts !== undefined
    ? !!req.body.newMatchAlerts
    : !!(req.body.emailAlerts || req.body.alertsEnabled);
  const priceChangeAlerts = !!req.body.priceChangeAlerts;
  const doc = await SavedSearch.create({
    user: req.user._id,
    name: req.body.name || 'Saved search',
    filters: req.body.filters || {},
    emailAlerts: !!req.body.emailAlerts,
    whatsappAlerts: !!req.body.whatsappAlerts,
    newMatchAlerts,
    priceChangeAlerts,
    alertsEnabled: anyAlerts({ ...req.body, newMatchAlerts, priceChangeAlerts }),
  });
  res.status(201).json({ data: doc });
};

exports.remove = async (req, res) => {
  await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
};

exports.update = async (req, res) => {
  const doc = await SavedSearch.findOne({ _id: req.params.id, user: req.user._id });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (req.body.name !== undefined) doc.name = String(req.body.name || 'Saved search').slice(0, 80);
  if (req.body.filters !== undefined) doc.filters = req.body.filters;
  ['emailAlerts', 'whatsappAlerts', 'newMatchAlerts', 'priceChangeAlerts', 'alertsEnabled'].forEach((k) => {
    if (req.body[k] !== undefined) doc[k] = Boolean(req.body[k]);
  });
  doc.alertsEnabled = anyAlerts(req.body, doc);
  await doc.save();
  res.json({ data: doc });
};
