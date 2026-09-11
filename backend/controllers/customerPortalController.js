const Car = require('../models/Car');
const Lead = require('../models/Lead');
const Enquiry = require('../models/Enquiry');
const TestDrive = require('../models/TestDrive');
const Booking = require('../models/Booking');
const Comparison = require('../models/Comparison');
const UserProfile = require('../models/UserProfile');
const SavedSearch = require('../models/SavedSearch');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const { validateEmail } = require('../utils/kycValidators');
const { recordActivity } = require('../models/UserDashboard');

const CAR_POP = [
  { path: 'brand', select: 'name logo' },
  { path: 'model', select: 'name' },
  { path: 'city', select: 'name' },
  { path: 'owner', select: 'name mobile dealershipName' },
];

function enquiryStatus(raw) {
  const map = {
    New: 'Submitted',
    Submitted: 'Submitted',
    Assigned: 'Dealer Responded',
    'In Progress': 'Dealer Responded',
    Quoted: 'Dealer Responded',
    'Dealer Responded': 'Dealer Responded',
    Closed: 'Closed',
    Rejected: 'Closed',
  };
  return map[raw] || raw || 'Submitted';
}

function financeStatus(raw) {
  const map = {
    New: 'Under Review',
    Submitted: 'Under Review',
    Assigned: 'Under Review',
    'In Progress': 'Under Review',
    'Under Review': 'Under Review',
    Quoted: 'Pre-Approved',
    'Pre-Approved': 'Pre-Approved',
    'Documents Required': 'Documents Required',
    Disbursed: 'Disbursed',
    Closed: 'Disbursed',
    Rejected: 'Documents Required',
  };
  return map[raw] || 'Under Review';
}

function driveStatus(raw) {
  const map = {
    Requested: 'Pending Confirmation',
    Scheduled: 'Pending Confirmation',
    Rescheduled: 'Pending Confirmation',
    Confirmed: 'Confirmed',
    'In Progress': 'Confirmed',
    Completed: 'Completed',
    'Feedback Recorded': 'Completed',
    Cancelled: 'Cancelled',
    'No-Show': 'Cancelled',
  };
  return map[raw] || raw || 'Pending Confirmation';
}

async function getOrCreateProfile(userId) {
  let profile = await UserProfile.findOne({ user: userId });
  if (!profile) profile = await UserProfile.create({ user: userId });
  return profile;
}

exports.getProfile = async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      city: req.user.city,
      avatar: profile.avatar || req.user.avatar,
      mobileVerified: Boolean(req.user.mobileVerified || req.user.isVerified),
      emailVerified: Boolean(req.user.emailVerified),
      preferredCity: profile.preferredCity,
      preferredBrands: profile.preferredBrands || [],
      preferredModels: profile.preferredModels || [],
      budgetMin: profile.budgetMin,
      budgetMax: profile.budgetMax,
    },
  });
};

exports.updatePreferences = async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  if (req.body.name !== undefined) req.user.name = String(req.body.name).trim();
  if (req.body.city !== undefined) req.user.city = String(req.body.city).trim();
  if (req.body.email !== undefined && req.body.email !== req.user.email) {
    const mail = validateEmail(req.body.email);
    if (!mail.ok) return res.status(400).json({ message: mail.message });
    const taken = await require('../models/User').findOne({ email: mail.value, _id: { $ne: req.user._id } });
    if (taken) return res.status(400).json({ message: 'Email already in use' });
    req.user.email = mail.value;
    req.user.emailVerified = false;
  }
  if (req.body.preferredCity !== undefined) {
    profile.preferredCity = String(req.body.preferredCity).trim();
    if (!req.user.city) req.user.city = profile.preferredCity;
  }
  if (Array.isArray(req.body.preferredBrands)) profile.preferredBrands = req.body.preferredBrands.map(String);
  if (Array.isArray(req.body.preferredModels)) profile.preferredModels = req.body.preferredModels.map(String);
  if (req.body.budgetMin !== undefined) profile.budgetMin = req.body.budgetMin === '' ? null : Number(req.body.budgetMin);
  if (req.body.budgetMax !== undefined) profile.budgetMax = req.body.budgetMax === '' ? null : Number(req.body.budgetMax);
  await Promise.all([req.user.save(), profile.save()]);
  await recordActivity(req.user._id, { type: 'other', title: 'Updated buying preferences' });
  return exports.getProfile(req, res);
};

exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Profile photo is required' });
  const url = `/uploads/avatars/${req.file.filename}`;
  const profile = await getOrCreateProfile(req.user._id);
  profile.avatar = url;
  req.user.avatar = url;
  await Promise.all([profile.save(), req.user.save()]);
  res.json({ success: true, avatar: url });
};

exports.listEnquiries = async (req, res) => {
  const userId = req.user._id;
  const [leads, enquiries] = await Promise.all([
    Lead.find({ $or: [{ email: req.user.email || '__none__' }, { phone: req.user.mobile || '__none__' }] })
      .populate('car', 'title price year')
      .sort('-createdAt')
      .lean(),
    Enquiry.find({ user: userId, type: { $nin: ['finance', 'insurance'] } })
      .populate('vehicle', 'title price year')
      .sort('-createdAt')
      .lean(),
  ]);
  const data = [
    ...leads.map((l) => ({
      id: l._id,
      kind: 'vehicle',
      title: l.car?.title || 'Vehicle enquiry',
      message: l.message,
      status: enquiryStatus(l.status),
      createdAt: l.createdAt,
    })),
    ...enquiries.map((e) => ({
      id: e._id,
      kind: e.type,
      title: [e.brand, e.model, e.vehicle?.title].filter(Boolean).join(' ') || 'Seller enquiry',
      message: e.message,
      status: enquiryStatus(e.status),
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data });
};

exports.listTestDrives = async (req, res) => {
  const data = await TestDrive.find({ user: req.user._id })
    .populate({ path: 'vehicle', select: 'title price images year', populate: CAR_POP })
    .populate('dealer', 'name dealershipName city')
    .sort('-preferredDate')
    .lean();
  res.json({
    success: true,
    data: data.map((d) => ({
      id: d._id,
      vehicle: d.vehicle,
      dealerName: d.dealer?.dealershipName || d.dealer?.name || '',
      location: d.location || d.dealer?.city || '',
      preferredDate: d.preferredDate,
      preferredTime: d.preferredTime,
      homeTestDrive: d.homeTestDrive,
      status: driveStatus(d.status),
    })),
  });
};

exports.listBookings = async (req, res) => {
  const data = await Booking.find({ user: req.user._id })
    .populate('vehicle', 'title price images year')
    .populate('dealer', 'name dealershipName')
    .sort('-createdAt')
    .lean();
  res.json({
    success: true,
    data: data.map((b) => ({
      id: b._id,
      bookingRef: b.bookingRef,
      invoiceRef: b.invoiceRef,
      vehicle: b.vehicle,
      amount: b.tokenAmount || b.amount,
      status: b.status,
      createdAt: b.createdAt,
      refunded: ['Cancelled', 'Cancelled/Refunded', 'Refunded'].includes(b.status),
    })),
  });
};

exports.bookingReceipt = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
    .populate('vehicle', 'title price year')
    .populate('dealer', 'name dealershipName');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.invoiceRef = booking.invoiceRef || `INV-${booking.bookingRef}`;
  await booking.save();
  const html = `<!doctype html><html><head><title>${booking.invoiceRef}</title>
    <style>body{font-family:Montserrat,Arial,sans-serif;padding:32px}h1{color:#3083ff}</style></head><body>
    <h1>4TYREZZ Booking confirmation</h1>
    <p>${booking.invoiceRef} · ${booking.bookingRef}</p>
    <p>${booking.vehicle?.title || ''}</p>
    <p>Token ₹${Number(booking.tokenAmount || booking.amount || 0).toLocaleString('en-IN')}</p>
    <p>Status: ${booking.status}</p>
    </body></html>`;
  res.json({ success: true, invoiceRef: booking.invoiceRef, html });
};

exports.listFinance = async (req, res) => {
  const data = await Enquiry.find({ user: req.user._id, type: 'finance' })
    .populate('vehicle', 'title price year')
    .sort('-createdAt')
    .lean();
  res.json({
    success: true,
    data: data.map((e) => ({
      id: e._id,
      vehicle: e.vehicle,
      loanAmount: e.loanAmount,
      tenureMonths: e.tenureMonths,
      bankName: e.bankName || e.partnerName || '',
      status: financeStatus(e.status),
      createdAt: e.createdAt,
    })),
  });
};

exports.listInsurance = async (req, res) => {
  const data = await Enquiry.find({ user: req.user._id, type: 'insurance' })
    .populate('vehicle', 'title price year')
    .sort('-createdAt')
    .lean();
  res.json({
    success: true,
    data: data.map((e) => ({
      id: e._id,
      vehicle: e.vehicle,
      insuranceType: e.insuranceType,
      addOns: e.addOns || [],
      premium: e.premium,
      status: e.status,
      createdAt: e.createdAt,
    })),
  });
};

exports.listComparisons = async (req, res) => {
  const rows = await Comparison.find({ user: req.user._id })
    .populate({ path: 'vehicles', populate: CAR_POP })
    .sort('-updatedAt')
    .lean();
  res.json({ success: true, data: rows });
};

exports.saveComparison = async (req, res) => {
  const ids = (req.body.vehicles || req.body.ids || []).filter((id) => /^[a-fA-F0-9]{24}$/.test(String(id))).slice(0, 4);
  if (ids.length < 2) return res.status(400).json({ message: 'Select at least two vehicles' });
  const doc = await Comparison.create({
    user: req.user._id,
    name: req.body.name || 'Comparison',
    vehicles: ids,
  });
  const populated = await Comparison.findById(doc._id).populate({ path: 'vehicles', populate: CAR_POP });
  res.status(201).json({ success: true, data: populated });
};

exports.removeComparison = async (req, res) => {
  await Comparison.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
};

exports.toggleSavedSearchAlerts = async (req, res) => {
  const doc = await SavedSearch.findOne({ _id: req.params.id, user: req.user._id });
  if (!doc) return res.status(404).json({ message: 'Saved search not found' });
  ['emailAlerts', 'whatsappAlerts', 'newMatchAlerts', 'priceChangeAlerts'].forEach((k) => {
    if (req.body[k] !== undefined) doc[k] = Boolean(req.body[k]);
  });
  doc.alertsEnabled = Boolean(doc.emailAlerts || doc.whatsappAlerts || doc.newMatchAlerts || doc.priceChangeAlerts);
  await doc.save();
  res.json({ success: true, data: doc });
};

exports.listWishlist = async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id }).populate({ path: 'car', populate: CAR_POP }).sort('-createdAt').lean();
  const data = items
    .map((w) => w.car)
    .filter(Boolean)
    .map((car) => {
      const history = car.priceHistory || [];
      const current = Number(car.price);
      const prevHigher = [...history].reverse().find((h) => Number(h.price) > current);
      const dropped = prevHigher ? Number(prevHigher.price) - current : 0;
      const sold = car.status === 'sold' || car.listingStatus === 'SOLD';
      const unavailable = car.unpublished || car.availability === 'unavailable' || sold;
      return { ...car, priceDrop: dropped, unavailable, sold };
    });
  res.json({ success: true, data });
};

exports.markAllNotifications = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
};

exports.createTicket = async (req, res) => {
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();
  if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required' });
  const doc = await SupportTicket.create({
    user: req.user._id,
    name: req.user.name || 'Customer',
    email: req.user.email || '',
    phone: req.user.mobile || '',
    category: req.body.category || 'general',
    subject,
    message,
    status: 'open',
  });
  res.status(201).json({ success: true, data: doc });
};

exports.listTickets = async (req, res) => {
  const data = await SupportTicket.find({ user: req.user._id }).sort('-updatedAt').lean();
  res.json({
    success: true,
    data: data.map((t) => ({
      ...t,
      statusLabel: t.status === 'in_progress' ? 'In Progress' : t.status === 'open' ? 'Open' : t.status === 'resolved' ? 'Resolved' : t.status,
    })),
  });
};

exports.replyTicket = async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  const body = String(req.body.body || req.body.message || '').trim();
  if (!body) return res.status(400).json({ message: 'Reply is required' });
  ticket.replies.push({ author: req.user.name || 'You', role: 'customer', body });
  if (ticket.status === 'resolved') ticket.status = 'in_progress';
  await ticket.save();
  res.json({ success: true, data: ticket });
};

exports.listSavedSearches = async (req, res) => {
  const data = await SavedSearch.find({ user: req.user._id }).sort('-createdAt').lean();
  res.json({ success: true, data });
};
