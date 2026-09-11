const Car = require('../models/Car');
const Lead = require('../models/Lead');
const LeadFollowUp = require('../models/LeadFollowUp');
const TestDrive = require('../models/TestDrive');
const Booking = require('../models/Booking');
const DealerProfile = require('../models/DealerProfile');
const User = require('../models/User');
const { dispatchSafe, EVENTS } = require('../services/notifyService');
const { PIPELINE_STAGES, CALL_OUTCOMES } = require('../models/LeadCRM');
const {
  validatePan,
  validateGstin,
  validateIfsc,
  validateBankAccount,
  validateMobile,
  validateEmail,
  validatePincode,
} = require('../utils/kycValidators');
const { scopedDealerId, publicListingFilter } = require('../utils/listingStatus');

const PENDING_REVIEW = ['PENDING_ADMIN_APPROVAL', 'PENDING_KYC_APPROVAL', 'submitted', 'under_review'];

function toPublicProfile(profile) {
  if (!profile) return null;
  const obj = profile.toObject ? profile.toObject({ virtuals: true }) : profile;
  const missing = profile.missingRequirements ? profile.missingRequirements() : { fields: [], documents: [] };
  return {
    ...obj,
    missing,
    canSubmit: missing.fields.length === 0 && missing.documents.length === 0 && Boolean(obj.panVerified && obj.gstVerified),
  };
}

async function getOrCreateProfile(userId) {
  let profile = await DealerProfile.findOne({ user: userId });
  if (!profile) {
    const user = await User.findById(userId);
    profile = await DealerProfile.create({
      user: userId,
      businessName: user?.dealershipName || '',
      contactPerson: user?.name || '',
      contactPhone: user?.mobile || '',
      contactEmail: user?.email || '',
      city: user?.city || '',
      kycStatus: 'not_started',
      onboardingStatus: 'IN_PROGRESS',
    });
  }
  return profile;
}

function inferredOnboardingStep(profile, user) {
  if (!user) return 1;
  if (profile?.kycStatus === 'approved' || profile?.onboardingStatus === 'APPROVED') return 4;
  if (PENDING_REVIEW.includes(profile?.kycStatus) || profile?.onboardingStatus === 'PENDING_ADMIN_APPROVAL') return 4;
  const hasBiz = Boolean(profile?.businessName && profile?.addressLine1 && profile?.city && profile?.state);
  if (hasBiz) return 3;
  return 2;
}

exports.getOnboarding = async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  res.json({
    success: true,
    data: {
      profile: toPublicProfile(profile),
      step: profile.onboardingStep || inferredOnboardingStep(profile, req.user),
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobile: req.user.mobile,
        dealershipName: req.user.dealershipName,
        kycVerified: Boolean(profile.kycVerified || req.user.kycVerified),
      },
    },
  });
};

exports.saveOnboarding = async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  if (profile.kycStatus === 'approved' && profile.onboardingStatus === 'APPROVED') {
    return res.status(400).json({ message: 'Approved dealer profiles are locked' });
  }
  if (PENDING_REVIEW.includes(profile.kycStatus) && profile.submittedAt) {
    return res.status(400).json({ message: 'Onboarding is locked while admin reviews your file' });
  }

  if (req.body.panNumber) {
    const pan = validatePan(req.body.panNumber);
    if (!pan.ok) return res.status(400).json({ message: pan.message, field: 'panNumber' });
    req.body.panNumber = pan.value;
  }
  if (req.body.gstNumber) {
    const gst = validateGstin(req.body.gstNumber, req.body.panNumber || profile.panNumber);
    if (!gst.ok) return res.status(400).json({ message: gst.message, field: 'gstNumber' });
    req.body.gstNumber = gst.value;
  }
  if (req.body.contactPhone) {
    const phone = validateMobile(req.body.contactPhone);
    if (!phone.ok) return res.status(400).json({ message: phone.message, field: 'contactPhone' });
    req.body.contactPhone = phone.value;
  }
  if (req.body.contactEmail) {
    const mail = validateEmail(req.body.contactEmail);
    if (!mail.ok) return res.status(400).json({ message: mail.message, field: 'contactEmail' });
    req.body.contactEmail = mail.value;
  }
  if (req.body.pincode) {
    const pin = validatePincode(req.body.pincode);
    if (!pin.ok) return res.status(400).json({ message: pin.message, field: 'pincode' });
    req.body.pincode = pin.value;
  }
  if (req.body.bankIfsc) {
    const ifsc = validateIfsc(req.body.bankIfsc);
    if (!ifsc.ok) return res.status(400).json({ message: ifsc.message, field: 'bankIfsc' });
    req.body.bankIfsc = ifsc.value;
  }
  if (req.body.bankAccountNumber) {
    const acc = validateBankAccount(req.body.bankAccountNumber);
    if (!acc.ok) return res.status(400).json({ message: acc.message, field: 'bankAccountNumber' });
    req.body.bankAccountNumber = acc.value;
  }
  if (req.body.geo && typeof req.body.geo === 'object') {
    profile.geo = {
      lat: req.body.geo.lat != null ? Number(req.body.geo.lat) : profile.geo?.lat,
      lng: req.body.geo.lng != null ? Number(req.body.geo.lng) : profile.geo?.lng,
    };
  }

  const allowed = [
    'businessName',
    'legalEntityName',
    'businessType',
    'gstNumber',
    'panNumber',
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'pincode',
    'googlePlaceId',
    'operatingHours',
    'about',
    'bankAccountName',
    'bankAccountNumber',
    'bankIfsc',
    'bankName',
    'salesReps',
    'contactPerson',
    'contactPhone',
    'contactEmail',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) profile[key] = req.body[key];
  });
  if (req.body.onboardingStep) profile.onboardingStep = Number(req.body.onboardingStep);
  if (profile.kycStatus === 'not_started' || profile.kycStatus === 'rejected') profile.kycStatus = 'draft';
  profile.onboardingStatus = 'IN_PROGRESS';
  await profile.save();

  await User.findByIdAndUpdate(req.user._id, {
    dealershipName: profile.businessName || req.user.dealershipName,
    city: profile.city || req.user.city,
    name: profile.contactPerson || req.user.name,
  });

  res.json({ success: true, data: toPublicProfile(profile) });
};

exports.submitOnboarding = async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  if (profile.kycStatus === 'approved') {
    return res.status(400).json({ message: 'Dealer is already approved' });
  }
  const missing = profile.missingRequirements();
  if (missing.fields.length || missing.documents.length) {
    return res.status(400).json({ message: 'Complete business details, bank payouts and documents before submitting', missing });
  }
  if (!profile.panVerified || !profile.gstVerified) {
    return res.status(400).json({
      message: 'Verify PAN and GSTIN before submitting for admin approval',
      panVerified: !!profile.panVerified,
      gstVerified: !!profile.gstVerified,
    });
  }
  profile.kycStatus = 'PENDING_ADMIN_APPROVAL';
  profile.onboardingStatus = 'PENDING_ADMIN_APPROVAL';
  profile.onboardingStep = 4;
  profile.kycVerified = false;
  profile.submittedAt = new Date();
  profile.rejectionReason = '';
  await profile.save();

  await dispatchSafe({
    event: EVENTS.NEW_DEALER_KYC,
    title: 'New Dealer KYC',
    message: `${profile.businessName || 'A dealer'} submitted KYC for admin approval`,
    entityId: profile._id,
    meta: { dealerId: req.user._id, profileId: profile._id },
    adminOnly: true,
  });

  res.json({
    success: true,
    data: toPublicProfile(profile),
    message: 'Submitted for admin approval. Inventory publishing stays locked until approved.',
  });
};

exports.dashboardKpis = async (req, res) => {
  const owner = scopedDealerId(req);
  const cars = await Car.find({ owner }).select('_id status listingStatus unpublished');
  const ids = cars.map((c) => c._id);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    totalInventory,
    activeListings,
    soldCars,
    newLeads,
    pendingFollowUps,
    scheduledTestDrives,
    tokenBookings,
    soldBookings,
    closedWon,
  ] = await Promise.all([
    Car.countDocuments({ owner }),
    Car.countDocuments({ owner, ...publicListingFilter() }),
    Car.countDocuments({ owner, status: 'sold' }),
    Lead.countDocuments({ seller: owner, createdAt: { $gte: weekAgo } }),
    Lead.countDocuments({
      seller: owner,
      followUpAt: { $ne: null },
      stage: { $nin: ['Sold', 'Lost'] },
      status: { $nin: ['Sold', 'Lost', 'Closed', 'Closed/Won'] },
    }),
    TestDrive.countDocuments({
      dealer: owner,
      status: { $in: ['Requested', 'Confirmed', 'Rescheduled', 'Scheduled', 'In Progress'] },
    }),
    Booking.countDocuments({ dealer: owner, status: { $in: ['Token Received', 'Booked', 'Payment Pending', 'Confirmed'] } }),
    Booking.find({ dealer: owner, status: { $in: ['Fully Paid', 'Completed'] } }).select('amount saleAmount tokenAmount'),
    Lead.countDocuments({ seller: owner, $or: [{ stage: 'Sold' }, { status: { $in: ['Sold', 'Closed/Won'] } }] }),
  ]);

  const totalLeads = await Lead.countDocuments({ seller: owner });
  const totalRevenue = soldBookings.reduce((sum, b) => sum + Number(b.saleAmount || b.amount || 0), 0);
  const conversionRate = totalLeads ? Number(((closedWon / totalLeads) * 100).toFixed(1)) : 0;

  res.json({
    success: true,
    data: {
      totalInventory,
      activeListings,
      soldCars,
      newLeads,
      pendingFollowUps,
      scheduledTestDrives,
      tokenBookings,
      totalRevenue,
      conversionRate,
    },
  });
};

function crmStage(lead) {
  if (lead.stage && PIPELINE_STAGES.includes(lead.stage)) return lead.stage;
  const map = {
    New: 'New Lead',
    'New Lead': 'New Lead',
    Contacted: 'Contacted',
    'Follow-up': 'Follow-Up Scheduled',
    'Follow-Up': 'Follow-Up Scheduled',
    'Follow-Up Scheduled': 'Follow-Up Scheduled',
    'Test Drive Scheduled': 'Test Drive Booked',
    'Test Drive Booked': 'Test Drive Booked',
    Negotiation: 'Negotiation',
    Booked: 'Token Booked',
    'Token Booked': 'Token Booked',
    Sold: 'Sold',
    'Closed/Won': 'Sold',
    Closed: 'Sold',
    Lost: 'Lost',
  };
  return map[lead.status] || 'New Lead';
}

function followUpAlert(date) {
  if (!date) return 'Upcoming';
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(d);
  cmp.setHours(0, 0, 0, 0);
  if (cmp < today) return 'Overdue';
  if (cmp.getTime() === today.getTime()) return 'Today';
  return 'Upcoming';
}

exports.listLeads = async (req, res) => {
  const owner = scopedDealerId(req);
  const filter = { seller: owner };
  if (req.query.status) {
    filter.$or = [{ stage: req.query.status }, { status: req.query.status }];
  }
  if (req.query.source) filter.source = req.query.source;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
  }

  const leads = await Lead.find(filter)
    .populate({ path: 'car', select: 'title price year model', populate: { path: 'model', select: 'name' } })
    .sort('-createdAt')
    .lean();
  const modelQ = String(req.query.model || '').toLowerCase();
  const filtered = modelQ
    ? leads.filter((l) => `${l.car?.title || ''} ${l.car?.model?.name || ''}`.toLowerCase().includes(modelQ))
    : leads;

  const ids = filtered.map((l) => l._id);
  const activities = await LeadFollowUp.find({ lead: { $in: ids } }).sort('-createdAt').lean();
  const byLead = {};
  activities.forEach((a) => {
    const key = String(a.lead);
    if (!byLead[key]) byLead[key] = [];
    byLead[key].push(a);
  });

  const [drives] = await Promise.all([
    TestDrive.find({ dealer: owner }).populate('vehicle', 'title price year').sort('-createdAt').lean(),
  ]);

  const leadRows = filtered.map((l) => {
    const stage = crmStage(l);
    return {
      id: l._id,
      kind: 'buyer',
      leadId: `L-${String(l._id).slice(-6).toUpperCase()}`,
      customerName: l.name,
      mobile: l.phone,
      email: l.email || '',
      carTitle: l.car?.title || '',
      carId: l.car?._id,
      source: l.source || l.enquiryType || 'website',
      status: l.status,
      stage,
      column: stage,
      assignedRep: l.assignedRep || '',
      callOutcome: l.callOutcome || '',
      followUpAt: l.followUpAt,
      alert: followUpAlert(l.followUpAt),
      remarks: l.remarks,
      remarksLog: l.remarksLog || [],
      stageHistory: l.stageHistory || [],
      activities: byLead[String(l._id)] || l.activity || [],
      bookingId: l.booking || null,
      createdAt: l.createdAt,
    };
  });

  const driveRows = (req.query.source && req.query.source !== 'test_drive' ? [] : drives).map((d) => ({
    id: d._id,
    kind: 'test_drive',
    leadId: `TD-${String(d._id).slice(-6).toUpperCase()}`,
    customerName: d.customerName,
    mobile: d.customerPhone,
    email: '',
    carTitle: d.vehicle?.title || '',
    carId: d.vehicle?._id,
    source: 'test_drive',
    status: d.status,
    stage: 'Test Drive Booked',
    column: 'Test Drive Booked',
    assignedRep: '',
    callOutcome: '',
    followUpAt: d.preferredDate,
    alert: followUpAlert(d.preferredDate),
    remarks: d.notes || '',
    remarksLog: [],
    stageHistory: [],
    activities: [],
    createdAt: d.createdAt,
  }));

  const valuationRows = [];

  const data = [...leadRows, ...driveRows, ...valuationRows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, columns: PIPELINE_STAGES, callOutcomes: CALL_OUTCOMES, data });
};

exports.updateLeadStage = async (req, res) => {
  const owner = scopedDealerId(req);
  const stage = req.body.stage || req.body.status || req.body.column;
  if (!PIPELINE_STAGES.includes(stage)) {
    return res.status(400).json({ message: 'Invalid pipeline stage', allowed: PIPELINE_STAGES });
  }
  const lead = await Lead.findOne({ _id: req.params.id, seller: owner });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  const from = crmStage(lead);
  lead.stageHistory = lead.stageHistory || [];
  lead.stageHistory.push({ from, to: stage, at: new Date() });
  lead.stage = stage;
  lead.status = stage;
  if (req.body.assignedRep != null) lead.assignedRep = req.body.assignedRep;
  if (req.body.followUpAt) lead.followUpAt = new Date(req.body.followUpAt);
  if (req.body.callOutcome) lead.callOutcome = req.body.callOutcome;
  if (req.body.remarks) {
    lead.remarks = req.body.remarks;
    lead.remarksLog.push({ note: req.body.remarks, outcome: req.body.callOutcome || '', createdAt: new Date() });
  }
  await lead.save();
  res.json({ success: true, data: lead });
};

exports.assignLead = async (req, res) => {
  const owner = scopedDealerId(req);
  const lead = await Lead.findOne({ _id: req.params.id, seller: owner });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  lead.assignedRep = String(req.body.assignedRep || req.body.rep || '').trim();
  if (req.body.followUpAt) lead.followUpAt = new Date(req.body.followUpAt);
  if (req.body.remarks) {
    lead.remarks = req.body.remarks;
    lead.remarksLog.push({ note: req.body.remarks, outcome: req.body.callOutcome || '', createdAt: new Date() });
  }
  if (req.body.callOutcome) lead.callOutcome = req.body.callOutcome;
  await lead.save();
  res.json({ success: true, data: lead });
};

exports.convertLeadToBooking = async (req, res) => {
  const owner = scopedDealerId(req);
  const lead = await Lead.findOne({ _id: req.params.id, seller: owner }).populate('car');
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  if (!lead.car) return res.status(400).json({ message: 'Lead has no vehicle to convert' });

  const tokenAmount = Number(req.body.tokenAmount || req.body.amount || process.env.BOOKING_TOKEN_AMOUNT || 5000);
  let customer = await User.findOne({ mobile: lead.phone, role: 'customer' });
  if (!customer) {
    customer = await User.create({
      name: lead.name,
      mobile: lead.phone,
      email: lead.email || undefined,
      role: 'customer',
    });
  }

  const booking = await Booking.create({
    user: customer._id,
    vehicle: lead.car._id,
    dealer: owner,
    amount: tokenAmount,
    tokenAmount,
    saleAmount: lead.car.price,
    status: 'Token Received',
    customerName: lead.name,
    customerPhone: lead.phone,
    customerEmail: lead.email || '',
    lead: lead._id,
    notes: req.body.notes || 'Converted from CRM lead',
  });

  const from = crmStage(lead);
  lead.stage = 'Token Booked';
  lead.status = 'Token Booked';
  lead.booking = booking._id;
  lead.stageHistory.push({ from, to: 'Token Booked', at: new Date() });
  await lead.save();

  res.status(201).json({ success: true, data: booking });
};

exports.analyticsReports = async (req, res) => {
  const owner = scopedDealerId(req);
  const cars = await Car.find({ owner })
    .select('title price views enquiryCount phoneEnquiryCount whatsappEnquiryCount status listingStatus brand model createdAt updatedAt priceHistory')
    .populate('brand', 'name')
    .populate('model', 'name')
    .lean();

  const [leads, drives, bookings, contacted] = await Promise.all([
    Lead.find({ seller: owner }).select('status stage createdAt car followUpAt').lean(),
    TestDrive.find({ dealer: owner }).select('status createdAt').lean(),
    Booking.find({ dealer: owner }).select('status amount saleAmount createdAt').lean(),
    Lead.countDocuments({ seller: owner, $or: [{ stage: { $ne: 'New Lead' } }, { status: { $nin: ['New', 'New Lead'] } }] }),
  ]);

  const leadsReceived = leads.length;
  const responseRate = leadsReceived ? Number(((contacted / leadsReceived) * 100).toFixed(1)) : 0;
  const testDrivesTaken = drives.filter((d) => ['Completed', 'Feedback Recorded', 'In Progress'].includes(d.status)).length || drives.length;
  const finalBookings = bookings.filter((b) => !['Cancelled', 'Cancelled/Refunded', 'Refunded'].includes(b.status)).length;
  const sales = bookings.filter((b) => ['Fully Paid', 'Completed'].includes(b.status)).length;
  const conversionRate = leadsReceived ? Number(((sales / leadsReceived) * 100).toFixed(1)) : 0;

  const byModel = {};
  cars.forEach((c) => {
    const key = c.model?.name || c.title || 'Other';
    if (!byModel[key]) byModel[key] = { model: key, views: 0, enquiries: 0, price: c.price };
    byModel[key].views += Number(c.views || 0);
    byModel[key].enquiries += Number(c.enquiryCount || 0);
  });
  leads.forEach((l) => {
    const car = cars.find((c) => String(c._id) === String(l.car));
    const key = car?.model?.name || car?.title;
    if (key && byModel[key]) byModel[key].enquiries += 1;
  });
  const topInventory = Object.values(byModel)
    .sort((a, b) => b.enquiries + b.views - (a.enquiries + a.views))
    .slice(0, 8);

  const engagement = cars
    .map((c) => ({
      id: c._id,
      title: c.title,
      views: Number(c.views || 0),
      phone: Number(c.phoneEnquiryCount || 0),
      whatsapp: Number(c.whatsappEnquiryCount || 0),
      enquiries: Number(c.enquiryCount || 0),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  const elasticity = cars
    .filter((c) => (c.priceHistory || []).length > 0)
    .map((c) => {
      const drops = (c.priceHistory || []).filter((p, i, arr) => i > 0 && p.price < arr[i - 1].price);
      const related = leads.filter((l) => String(l.car) === String(c._id));
      const afterDrop = drops.length
        ? related.filter((l) => new Date(l.createdAt) >= new Date(drops[0].changedAt)).length
        : related.length;
      return {
        id: c._id,
        title: c.title,
        drops: drops.length,
        lastPrice: c.price,
        leadsAfterDrop: afterDrop,
        conversionSpeedDays: related.length
          ? Math.round(
              related.reduce((sum, l) => sum + Math.max(1, (new Date(l.createdAt) - new Date(c.createdAt)) / 86400000), 0) /
                related.length
            )
          : null,
      };
    });

  res.json({
    success: true,
    data: {
      funnel: {
        leadsReceived,
        responseRate,
        testDrivesTaken,
        bookings: finalBookings,
        sales,
        conversionRate,
      },
      topInventory,
      engagement,
      elasticity,
    },
  });
};

exports.PIPELINE_STAGES = PIPELINE_STAGES;
