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
  const hasContact = Boolean(profile?.contactPerson && (profile?.contactPhone || profile?.contactEmail));
  const hasShowroom = Boolean(
    profile?.businessName && profile?.businessType && profile?.addressLine1 && profile?.city && profile?.state && profile?.pincode
  );
  const hasKyc = Boolean(profile?.panNumber && profile?.gstNumber && profile?.bankAccountNumber && profile?.bankIfsc);
  if (!hasContact) return 1;
  if (!hasShowroom) return 2;
  if (!hasKyc) return 3;
  return 3;
}

exports.getOnboarding = async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  res.json({
    success: true,
    data: {
      profile: toPublicProfile(profile),
      step: inferredOnboardingStep(profile, req.user),
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email || profile.contactEmail || '',
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

  const userPatch = {
    dealershipName: profile.businessName || req.user.dealershipName,
    city: profile.city || req.user.city,
    name: profile.contactPerson || req.user.name,
  };
  if (profile.contactEmail) {
    const taken = await User.findOne({ email: profile.contactEmail, _id: { $ne: req.user._id } });
    if (!taken) userPatch.email = profile.contactEmail;
  }
  await User.findByIdAndUpdate(req.user._id, userPatch);

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
  const [
    totalInventory,
    pendingListings,
    activeListings,
    soldCars,
  ] = await Promise.all([
    Car.countDocuments({ owner }),
    Car.countDocuments({
      owner,
      $or: [
        { status: { $in: ['pending', 'PENDING_MODERATION', 'draft'] } },
        { listingStatus: { $in: ['PENDING_MODERATION', 'DRAFT'] } },
      ],
    }),
    Car.countDocuments({ owner, ...publicListingFilter() }),
    Car.countDocuments({ owner, status: 'sold' }),
  ]);

  res.json({
    success: true,
    data: {
      totalInventory,
      pendingListings,
      activeListings,
      soldCars,
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
  return res.json({ success: true, data: [] });
};

exports.updateLeadStage = async (req, res) => {
  return res.status(403).json({ message: 'Buyer leads are handled by 4tyrezz admin' });
};

exports.assignLead = async (req, res) => {
  return res.status(403).json({ message: 'Buyer leads are handled by 4tyrezz admin' });
};

exports.convertLeadToBooking = async (req, res) => {
  return res.status(403).json({ message: 'Buyer leads are handled by 4tyrezz admin' });
};

exports.analyticsReports = async (req, res) => {
  const owner = scopedDealerId(req);
  const cars = await Car.find({ owner })
    .select('title price views status listingStatus unpublished brand model createdAt')
    .populate('brand', 'name')
    .populate('model', 'name')
    .lean();

  const pending = cars.filter((c) => ['pending', 'PENDING_MODERATION', 'draft'].includes(c.status) || ['PENDING_MODERATION', 'DRAFT'].includes(c.listingStatus)).length;
  const live = cars.filter((c) => c.status === 'approved' && !c.unpublished).length;
  const sold = cars.filter((c) => c.status === 'sold').length;

  res.json({
    success: true,
    data: {
      funnel: {
        pending,
        live,
        sold,
        total: cars.length,
      },
      topInventory: cars
        .map((c) => ({
          model: c.model?.name || c.title,
          views: Number(c.views || 0),
          status: c.listingStatus || c.status,
          price: c.price,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8),
      engagement: cars
        .map((c) => ({
          id: c._id,
          title: c.title,
          views: Number(c.views || 0),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 12),
      elasticity: [],
    },
  });
};

exports.PIPELINE_STAGES = PIPELINE_STAGES;
