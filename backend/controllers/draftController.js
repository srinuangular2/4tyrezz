const ListingDraft = require('../models/ListingDraft');

const KINDS = new Set(['sell', 'valuation']);

function kindOf(req) {
  const k = String(req.params.kind || '').toLowerCase();
  return KINDS.has(k) ? k : null;
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const next = { ...payload };
  delete next.photoFiles;
  if (Array.isArray(next.photoPreviews)) next.photoPreviews = next.photoPreviews.slice(0, 8);
  return next;
}

exports.get = async (req, res) => {
  const kind = kindOf(req);
  if (!kind) return res.status(400).json({ message: 'Invalid draft kind' });
  const doc = await ListingDraft.findOne({ user: req.user._id, kind });
  res.json({ data: doc?.payload || null, updatedAt: doc?.updatedAt || null });
};

exports.upsert = async (req, res) => {
  const kind = kindOf(req);
  if (!kind) return res.status(400).json({ message: 'Invalid draft kind' });
  const payload = sanitizePayload(req.body?.payload ?? req.body);
  const doc = await ListingDraft.findOneAndUpdate(
    { user: req.user._id, kind },
    { $set: { payload, user: req.user._id, kind } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ data: doc.payload, updatedAt: doc.updatedAt });
};

exports.remove = async (req, res) => {
  const kind = kindOf(req);
  if (!kind) return res.status(400).json({ message: 'Invalid draft kind' });
  await ListingDraft.findOneAndDelete({ user: req.user._id, kind });
  res.json({ success: true });
};
