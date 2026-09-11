const Car = require('../models/Car');
const Enquiry = require('../models/Enquiry');
const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');

exports.analytics = async (req, res) => {
  const owner = req.user._id;
  const cars = await Car.find({ owner }).select('_id');
  const ids = cars.map((c) => c._id);
  const [listings, pending, approved, sold, buyerLeads, testDrives, financeInsurance] = await Promise.all([
    Car.countDocuments({ owner }),
    Car.countDocuments({ owner, status: 'pending' }),
    Car.countDocuments({ owner, status: 'approved' }),
    Car.countDocuments({ owner, status: 'sold' }),
    Lead.countDocuments({ seller: owner }),
    TestDrive.countDocuments({ dealer: owner }),
    Enquiry.countDocuments({ type: { $in: ['finance', 'insurance'] }, vehicle: { $in: ids } }),
  ]);

  res.json({
    success: true,
    data: {
      listings,
      pending,
      approved,
      sold,
      buyerLeads,
      testDrives,
      financeInsurance,
    },
  });
};

exports.buyerLeads = async (req, res) => {
  const owner = req.user._id;
  const [leads, drives] = await Promise.all([
    Lead.find({ seller: owner }).populate('car', 'title price').sort('-createdAt').lean(),
    TestDrive.find({ dealer: owner }).populate('vehicle', 'title price').sort('-createdAt').lean(),
  ]);

  const data = [
    ...leads.map((l) => ({
      id: l._id,
      source: 'buyer',
      leadId: `L-${String(l._id).slice(-6).toUpperCase()}`,
      customerName: l.name,
      mobile: l.phone,
      carTitle: l.car?.title || '',
      preferredAt: l.followUpAt || l.createdAt,
      status: l.status,
      message: l.message,
      createdAt: l.createdAt,
    })),
    ...drives.map((d) => ({
      id: d._id,
      source: 'test_drive',
      leadId: `TD-${String(d._id).slice(-6).toUpperCase()}`,
      customerName: d.customerName,
      mobile: d.customerPhone,
      carTitle: d.vehicle?.title || '',
      preferredAt: d.preferredDate,
      preferredTime: d.preferredTime,
      status: d.status === 'Requested' ? 'New' : d.status === 'Confirmed' || d.status === 'Rescheduled' ? 'Test Drive Scheduled' : d.status === 'Completed' || d.status === 'Cancelled' ? 'Closed' : d.status,
      message: d.notes,
      createdAt: d.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data });
};

const SELL_PIPELINE = require('./enquiryController').SELL_PIPELINE;

exports.sellerLeads = async (req, res) => {
  const data = await Enquiry.find({
    type: 'seller',
    assignedTo: req.user._id,
  })
    .populate('user', 'name mobile email')
    .sort('-createdAt')
    .lean();

  res.json({
    success: true,
    pipeline: SELL_PIPELINE,
    data: data.map((e) => ({
      id: e._id,
      leadId: `SX-${String(e._id).slice(-6).toUpperCase()}`,
      type: 'seller',
      source: 'seller',
      intent: e.intent || 'sell',
      customerName: e.name || e.user?.name || 'Seller',
      mobile: e.phone || e.user?.mobile || '',
      email: e.email || '',
      carTitle: `${e.year || ''} ${e.brand || ''} ${e.model || ''} ${e.variant || ''}`.trim(),
      registrationNumber: e.registrationNumber || '',
      city: e.city || '',
      kmDriven: e.kmDriven,
      ownership: e.ownership,
      expectedPrice: e.expectedPrice,
      estimatePrice: e.estimatePrice,
      minPrice: e.minPrice,
      maxPrice: e.maxPrice,
      valuationPending: e.valuationPending,
      photos: e.photos || [],
      inspectionType: e.inspectionType,
      inspectionDate: e.inspectionDate,
      inspectionSlot: e.inspectionSlot,
      status: e.status,
      notes: e.notes || e.message || '',
      stageHistory: e.stageHistory || [],
      createdAt: e.createdAt,
    })),
  });
};

exports.financeInsuranceLeads = async (req, res) => {
  const cars = await Car.find({ owner: req.user._id }).select('_id');
  const ids = cars.map((c) => c._id);
  const data = await Enquiry.find({
    type: { $in: ['finance', 'insurance'] },
    $or: [{ vehicle: { $in: ids } }, { assignedTo: req.user._id }],
  })
    .populate('vehicle', 'title price')
    .populate('user', 'name mobile')
    .sort('-createdAt')
    .lean();

  res.json({
    success: true,
    data: data.map((e) => ({
      id: e._id,
      leadId: `${e.type === 'finance' ? 'FN' : 'IN'}-${String(e._id).slice(-6).toUpperCase()}`,
      type: e.type,
      customerName: e.name,
      mobile: e.phone,
      carTitle: e.vehicle?.title || '',
      bankName: e.bankName || '',
      loanAmount: e.loanAmount,
      tenureMonths: e.tenureMonths,
      cibilBracket: e.cibilBracket || '',
      employmentType: e.employmentType || e.employment || '',
      leadSource: e.leadSource || 'website',
      status: e.status,
      message: e.message,
      createdAt: e.createdAt,
    })),
  });
};

exports.updateLead = async (req, res) => {
  const { source, status } = req.body;
  if (source === 'test_drive') {
    const map = {
      New: 'Requested',
      Contacted: 'Requested',
      'Test Drive Scheduled': 'Confirmed',
      Closed: 'Cancelled',
    };
    const doc = await TestDrive.findOneAndUpdate(
      { _id: req.params.id, dealer: req.user._id },
      { status: map[status] || status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Lead not found' });
    return res.json({ success: true, data: doc });
  }
  if (source === 'finance' || source === 'insurance' || source === 'seller') {
    const filter = { _id: req.params.id, type: source === 'seller' ? 'seller' : source };
    if (req.user.role === 'dealer') {
      const cars = await Car.find({ owner: req.user._id }).select('_id');
      filter.$or = [{ vehicle: { $in: cars.map((c) => c._id) } }, { assignedTo: req.user._id }];
    }
    if (source === 'seller') {
      const { SELL_PIPELINE } = require('./enquiryController');
      if (status && !SELL_PIPELINE.includes(status)) {
        return res.status(400).json({ message: 'Invalid sell/exchange stage', allowed: SELL_PIPELINE });
      }
    }
    const prev = await Enquiry.findOne(filter);
    if (!prev) return res.status(404).json({ message: 'Lead not found' });
    const from = prev.status;
    prev.status = status;
    prev.stageHistory = prev.stageHistory || [];
    prev.stageHistory.push({ from, to: status, at: new Date() });
    await prev.save();
    return res.json({ success: true, data: prev });
  }
  const doc = await Lead.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id },
    { status },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Lead not found' });
  res.json({ success: true, data: doc });
};
