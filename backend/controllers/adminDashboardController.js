const Car = require('../models/Car');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Enquiry = require('../models/Enquiry');
const Valuation = require('../models/Valuation');
const DealerProfile = require('../models/DealerProfile');
const TestDrive = require('../models/TestDrive');
const SupportTicket = require('../models/SupportTicket');
const Review = require('../models/Review');
const SystemSettings = require('../models/SystemSettings');
const { PIPELINE_STAGES } = require('../models/LeadCRM');

const DEFAULT_SETTINGS = {
  commissionRatePercent: Number(process.env.COMMISSION_RATE_PERCENT || 2.5),
  leadChargeFixed: Number(process.env.LEAD_CHARGE_FIXED || 0),
  requireListingModeration: String(process.env.REQUIRE_LISTING_MODERATION || 'true') !== 'false',
  bookingTokenAmount: Number(process.env.BOOKING_TOKEN_AMOUNT || 5000),
  featureToggles: {
    homeTestDrive: true,
    financeDesk: true,
    insuranceDesk: true,
    compareTray: true,
  },
};

function monthStart(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + offset);
  return d;
}

function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

exports.metrics = async (_req, res) => {
  const thisMonth = monthStart(0);
  const lastMonth = monthStart(-1);
  const sixMonthsAgo = monthStart(-5);

  const [
    totalCars,
    totalUsers,
    totalDealers,
    pendingApproval,
    activeListings,
    soldCars,
    pendingKyc,
    valuationQueries,
    financeEnquiries,
    insuranceEnquiries,
    openTickets,
    gmvAgg,
    gmvThis,
    gmvLast,
    leadsThis,
    leadsLast,
    soldThis,
    soldLast,
    monthlyListings,
    monthlyGmv,
    recentLeads,
    recentBookings,
    recentTickets,
    recentKyc,
  ] = await Promise.all([
    Car.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'dealer' }),
    Car.countDocuments({ $or: [{ status: 'pending' }, { listingStatus: 'PENDING_MODERATION' }] }),
    Car.countDocuments({ status: 'approved', unpublished: { $ne: true } }),
    Car.countDocuments({ status: 'sold' }),
    DealerProfile.countDocuments({
      kycStatus: { $in: ['PENDING_KYC_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'submitted', 'under_review'] },
    }),
    Valuation.countDocuments(),
    Enquiry.countDocuments({ type: 'finance' }),
    Enquiry.countDocuments({ type: 'insurance' }),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: lastMonth, $lt: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Lead.countDocuments({ createdAt: { $gte: thisMonth } }),
    Lead.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
    Car.countDocuments({ status: 'sold', updatedAt: { $gte: thisMonth } }),
    Car.countDocuments({ status: 'sold', updatedAt: { $gte: lastMonth, $lt: thisMonth } }),
    Car.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    Lead.find().sort('-createdAt').limit(8).populate('car', 'title').lean(),
    Booking.find().sort('-createdAt').limit(8).populate('vehicle', 'title').populate('user', 'name').lean(),
    SupportTicket.find().sort('-createdAt').limit(6).lean(),
    DealerProfile.find({
      kycStatus: { $in: ['PENDING_KYC_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'submitted', 'under_review'] },
    })
      .sort('-updatedAt')
      .limit(6)
      .populate('user', 'name dealershipName')
      .lean(),
  ]);

  const gmv = gmvAgg[0]?.total || 0;
  const gmvThisMonth = gmvThis[0]?.total || 0;
  const gmvLastMonth = gmvLast[0]?.total || 0;

  const activity = [
    ...recentLeads.map((row) => ({
      id: String(row._id),
      type: 'lead',
      title: `${row.name} enquired`,
      body: row.car?.title || row.enquiryType || 'Lead',
      at: row.createdAt,
    })),
    ...recentBookings.map((row) => ({
      id: String(row._id),
      type: 'booking',
      title: `Booking ${row.bookingRef || ''}`.trim(),
      body: `${row.vehicle?.title || 'Vehicle'} · ${row.status}`,
      at: row.createdAt,
    })),
    ...recentTickets.map((row) => ({
      id: String(row._id),
      type: 'ticket',
      title: row.subject,
      body: `${row.priority} · ${row.status}`,
      at: row.createdAt,
    })),
    ...recentKyc.map((row) => ({
      id: String(row._id),
      type: 'kyc',
      title: 'KYC pending review',
      body: row.businessName || row.user?.dealershipName || row.user?.name || 'Dealer',
      at: row.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 20);

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
    insuranceEnquiries,
    openTickets,
    gmv,
    monthly: monthlyListings,
    monthlyGmv,
    activity,
    trends: {
      gmv: pctChange(gmvThisMonth, gmvLastMonth),
      leads: pctChange(leadsThis, leadsLast),
      sold: pctChange(soldThis, soldLast),
    },
    thisMonth: { gmv: gmvThisMonth, leads: leadsThis, sold: soldThis },
  });
};

exports.reports = async (_req, res) => {
  const sixMonthsAgo = monthStart(-5);
  const [gmvSeries, leadSeries, soldSeries, leadFunnel, inventory] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, gmv: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, leads: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Car.aggregate([
      { $match: { status: 'sold', updatedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } }, sold: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Lead.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Car.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const live = inventory.find((r) => r._id === 'approved')?.count || 0;
  const sold = inventory.find((r) => r._id === 'sold')?.count || 0;
  const turnover = live + sold > 0 ? Math.round((sold / (live + sold)) * 1000) / 10 : 0;

  res.json({
    gmvSeries,
    leadSeries,
    soldSeries,
    leadFunnel,
    inventory,
    inventoryTurnoverPercent: turnover,
  });
};

exports.listLeads = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.enquiryType) filter.enquiryType = req.query.enquiryType;
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { phone: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
    ];
  }
  const [total, data] = await Promise.all([
    Lead.countDocuments(filter),
    Lead.find(filter)
      .populate('car', 'title price images')
      .populate('seller', 'name dealershipName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.listTestDrives = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.home === 'true') filter.homeTestDrive = true;
  if (req.query.home === 'false') filter.homeTestDrive = false;
  const [total, data] = await Promise.all([
    TestDrive.countDocuments(filter),
    TestDrive.find(filter)
      .populate('vehicle', 'title images price year')
      .populate('user', 'name mobile email')
      .populate('dealer', 'name dealershipName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.listBookings = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [total, data] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .populate('vehicle', 'title images price year')
      .populate('user', 'name mobile email')
      .populate('dealer', 'name dealershipName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.updateLeadStage = async (req, res) => {
  const stage = req.body.stage || req.body.status;
  if (!PIPELINE_STAGES.includes(stage)) {
    return res.status(400).json({ message: 'Invalid pipeline stage', allowed: PIPELINE_STAGES });
  }
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  const from = lead.stage || lead.status || '';
  lead.stageHistory = lead.stageHistory || [];
  lead.stageHistory.push({ from, to: stage, at: new Date() });
  lead.stage = stage;
  lead.status = stage;
  await lead.save();
  res.json({ success: true, data: lead });
};

exports.listPayments = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [total, data] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter)
      .populate('vehicle', 'title')
      .populate('user', 'name email mobile')
      .populate('dealer', 'name dealershipName')
      .populate('booking', 'bookingRef status')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.refundPayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  payment.status = 'refunded';
  payment.meta = { ...(payment.meta || {}), refundNote: req.body.notes || 'Admin refund' };
  await payment.save();
  if (payment.booking) {
    await Booking.findByIdAndUpdate(payment.booking, { status: 'Cancelled/Refunded' });
  }
  res.json({ data: payment });
};

exports.getSettings = async (_req, res) => {
  const doc = await SystemSettings.findOne({ key: 'platform' });
  res.json({ data: { ...DEFAULT_SETTINGS, ...(doc?.value || {}) } });
};

exports.updateSettings = async (req, res) => {
  const next = { ...DEFAULT_SETTINGS, ...(req.body || {}) };
  const doc = await SystemSettings.findOneAndUpdate(
    { key: 'platform' },
    { value: next },
    { upsert: true, new: true }
  );
  res.json({ data: { ...DEFAULT_SETTINGS, ...(doc.value || {}) } });
};

exports.listReviewsAdmin = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [total, data] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .populate('user', 'name email')
      .populate('dealer', 'name dealershipName')
      .populate('vehicle', 'title')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
};
