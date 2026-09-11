const Enquiry = require('../models/Enquiry');
const Car = require('../models/Car');
const User = require('../models/User');
const { sendWhatsAppTemplate } = require('../services/integrations/msg91Service');
const { dispatchSafe, EVENTS } = require('../services/notifyService');

const SELL_PIPELINE = [
  'New',
  'Assigned',
  'Follow-up',
  'Inspection / Offer',
  'Purchased',
  'Exchanged',
  'Rejected',
  'Closed',
];

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function photoPaths(files = []) {
  return files
    .filter(Boolean)
    .map((f) => `/uploads/sell/${f.filename}`);
}

async function findEligibleDealer(city) {
  const name = String(city || '').trim();
  if (!name) return null;
  const rx = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  const dealers = await User.find({
    role: 'dealer',
    isActive: { $ne: false },
    city: rx,
  })
    .select('_id')
    .limit(8)
    .lean();
  if (dealers.length === 1) return dealers[0]._id;
  if (dealers.length > 1) return null;
  try {
    const DealerProfile = require('../models/DealerProfile');
    const profiles = await DealerProfile.find({ city: rx }).select('user').limit(8).lean();
    if (profiles.length === 1) return profiles[0].user;
  } catch {
    /* optional model */
  }
  return null;
}

exports.SELL_PIPELINE = SELL_PIPELINE;

exports.create = async (req, res) => {
  const type = req.body.type || req.params.type;
  if (!['finance', 'insurance', 'seller'].includes(type)) {
    return res.status(400).json({ message: 'Invalid enquiry type' });
  }
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ message: 'name and phone required' });

  const photos = photoPaths(req.files);
  let assignedTo = req.body.assignedTo || null;
  let status = type === 'finance' ? 'Under Review' : type === 'insurance' ? 'Submitted' : 'New';

  if (type === 'seller' && !assignedTo) {
    assignedTo = await findEligibleDealer(req.body.city);
    if (assignedTo) status = 'Assigned';
  }

  const intent = ['sell', 'exchange', 'both'].includes(req.body.intent) ? req.body.intent : 'sell';
  const estimatePrice = num(req.body.estimatePrice ?? req.body.estimate);
  const expectedPrice = num(req.body.expectedPrice);
  const valuationPending = req.body.valuationPending === true || req.body.valuationPending === 'true' || !estimatePrice;

  const doc = await Enquiry.create({
    ...req.body,
    type,
    intent: type === 'seller' ? intent : undefined,
    user: req.user?._id,
    vehicle: req.body.vehicle || req.body.vehicleId || req.body.carId || undefined,
    employmentType: req.body.employmentType || req.body.employment || '',
    loanAmount: req.body.loanAmount ?? req.body.meta?.loanAmount ?? null,
    tenureMonths: req.body.tenureMonths ?? req.body.meta?.months ?? null,
    downPayment: req.body.downPayment ?? req.body.meta?.downPayment ?? null,
    bankName: req.body.bankName || req.body.meta?.bankName || '',
    cibilBracket: req.body.cibilBracket || req.body.meta?.cibilBracket || '',
    leadSource: req.body.leadSource || 'website',
    status,
    assignedTo: assignedTo || undefined,
    addOns: req.body.addOns || [],
    photos,
    conditions: [].concat(req.body.conditions || []).filter(Boolean),
    expectedPrice,
    estimatePrice,
    minPrice: num(req.body.minPrice),
    maxPrice: num(req.body.maxPrice),
    valuationId: req.body.valuationId || null,
    valuationSource: req.body.valuationSource || '',
    valuationPending: type === 'seller' ? valuationPending : false,
    year: num(req.body.year),
    kmDriven: num(req.body.kmDriven),
    ownership: num(req.body.ownership),
    stageHistory: type === 'seller' ? [{ from: '', to: status, at: new Date() }] : [],
  });

  let dealerId = assignedTo;
  if (!dealerId && doc.vehicle) {
    const car = await Car.findById(doc.vehicle).select('owner title');
    dealerId = car?.owner;
  }
  const eventName =
    type === 'insurance' ? EVENTS.NEW_INSURANCE : type === 'finance' ? EVENTS.NEW_FINANCE : EVENTS.NEW_LEAD;
  const intentLabel = type === 'seller' ? (intent === 'exchange' ? 'exchange' : intent === 'both' ? 'sell/exchange' : 'sell') : type;
  await dispatchSafe({
    event: eventName,
    title: type === 'seller' ? `New ${intentLabel} lead` : `New ${type} enquiry`,
    message: `${name} submitted a ${intentLabel} enquiry${phone ? ` • ${phone}` : ''}${doc.brand ? ` • ${doc.year || ''} ${doc.brand} ${doc.model}` : ''}`,
    dealerId,
    entityId: doc._id,
    meta: { enquiryId: doc._id, enquiryType: type, soundKey: type === 'seller' ? 'lead' : type, phone, intent },
  });

  sendWhatsAppTemplate({
    mobile: phone,
    templateName: process.env.MSG91_WHATSAPP_TEMPLATE || 'enquiry_received',
    bodyValues: [name, intentLabel],
  }).catch(() => {});

  res.status(201).json({ data: doc });
};

exports.list = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.intent) filter.intent = req.query.intent;
  if (req.user.role === 'customer') filter.user = req.user._id;
  if (req.user.role === 'dealer') {
    const cars = await Car.find({ owner: req.user._id }).select('_id');
    filter.$or = [{ vehicle: { $in: cars.map((c) => c._id) } }, { assignedTo: req.user._id }];
  }

  const [total, data] = await Promise.all([
    Enquiry.countDocuments(filter),
    Enquiry.find(filter)
      .populate('vehicle', 'title')
      .populate('user', 'name mobile')
      .populate('assignedTo', 'name dealershipName email city')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1, pipeline: SELL_PIPELINE });
};

exports.update = async (req, res) => {
  const doc = await Enquiry.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  if (req.user.role === 'dealer') {
    const cars = await Car.find({ owner: req.user._id }).select('_id');
    const ownsVehicle = doc.vehicle && cars.some((c) => String(c._id) === String(doc.vehicle));
    const assigned = String(doc.assignedTo || '') === String(req.user._id);
    if (!ownsVehicle && !assigned) return res.status(403).json({ message: 'Not authorized' });
  }

  if (req.body.status) {
    if (doc.type === 'seller' && !SELL_PIPELINE.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid sell/exchange stage', allowed: SELL_PIPELINE });
    }
    const from = doc.status;
    doc.status = req.body.status;
    doc.stageHistory = doc.stageHistory || [];
    doc.stageHistory.push({ from, to: req.body.status, at: new Date() });
  }
  if (req.body.partnerName !== undefined) doc.partnerName = req.body.partnerName;
  if (req.body.assignedTo !== undefined) {
    doc.assignedTo = req.body.assignedTo || null;
    if (req.body.assignedTo && doc.type === 'seller' && doc.status === 'New') {
      doc.status = 'Assigned';
      doc.stageHistory.push({ from: 'New', to: 'Assigned', at: new Date() });
    }
  }
  if (req.body.notes !== undefined) doc.notes = req.body.notes;
  await doc.save();
  const populated = await Enquiry.findById(doc._id)
    .populate('assignedTo', 'name dealershipName email city')
    .populate('user', 'name mobile');
  res.json({ data: populated });
};
