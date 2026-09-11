const DealerProfile = require('../models/DealerProfile');
const User = require('../models/User');
const { sendWhatsAppTemplate } = require('../services/integrations/msg91Service');
const { dispatchSafe, EVENTS } = require('../services/notifyService');
const { validatePan, validateGstin, validateMobile, validateEmail, validatePincode } = require('../utils/kycValidators');

const LOCKED_REVIEW = ['submitted', 'under_review', 'approved', 'PENDING_ADMIN_APPROVAL'];

function isLocked(profile) {
  if (LOCKED_REVIEW.includes(profile?.kycStatus)) return true;
  return profile?.kycStatus === 'PENDING_KYC_APPROVAL' && Boolean(profile?.submittedAt);
}

function toPublic(profile) {
  if (!profile) return null;
  const obj = profile.toObject({ virtuals: true });
  const missing = profile.missingRequirements();
  return {
    ...obj,
    missing,
    canSubmit:
      missing.fields.length === 0 &&
      missing.documents.length === 0 &&
      Boolean(obj.panVerified && obj.gstVerified),
  };
}

async function getOrCreate(userId) {
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
    });
  }
  return profile;
}

exports.getMine = async (req, res) => {
  const profile = await getOrCreate(req.user._id);
  res.json({ data: toPublic(profile) });
};

exports.upsertMine = async (req, res) => {
  const profile = await getOrCreate(req.user._id);
  if (isLocked(profile)) {
    return res.status(400).json({ message: 'KYC is locked while under review or already approved' });
  }

  if (req.body.panNumber) {
    const pan = validatePan(req.body.panNumber);
    if (!pan.ok) return res.status(400).json({ message: pan.message, field: 'panNumber' });
    req.body.panNumber = pan.value;
    if (profile.panNumber && profile.panNumber !== pan.value) {
      profile.panVerified = false;
    }
  }
  if (req.body.gstNumber) {
    const gst = validateGstin(req.body.gstNumber, req.body.panNumber || profile.panNumber);
    if (!gst.ok) return res.status(400).json({ message: gst.message, field: 'gstNumber' });
    req.body.gstNumber = gst.value;
    if (profile.gstNumber && profile.gstNumber !== gst.value) {
      profile.gstVerified = false;
    }
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
    const ifsc = require('../utils/kycValidators').validateIfsc(req.body.bankIfsc);
    if (!ifsc.ok) return res.status(400).json({ message: ifsc.message, field: 'bankIfsc' });
    req.body.bankIfsc = ifsc.value;
  }
  if (req.body.bankAccountNumber) {
    const acc = require('../utils/kycValidators').validateBankAccount(req.body.bankAccountNumber);
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
    'aadhaarNumber',
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
  if (profile.kycStatus === 'not_started' || profile.kycStatus === 'rejected') {
    if (profile.kycStatus === 'rejected') profile.rejectionReason = '';
    profile.kycStatus = 'draft';
  }
  await profile.save();

  if (req.body.dealershipName || req.body.businessName) {
    await User.findByIdAndUpdate(req.user._id, {
      dealershipName: profile.businessName,
      city: profile.city || req.user.city,
      name: profile.contactPerson || req.user.name,
    });
  }

  res.json({ data: toPublic(profile) });
};

exports.submitMine = async (req, res) => {
  const profile = await getOrCreate(req.user._id);
  if (profile.kycStatus === 'approved') {
    return res.status(400).json({ message: 'KYC is already approved' });
  }
  const missing = profile.missingRequirements();
  if (missing.fields.length || missing.documents.length) {
    return res.status(400).json({
      message: 'Complete required business details and documents before submitting',
      missing,
    });
  }
  if (!profile.panVerified || !profile.gstVerified) {
    return res.status(400).json({
      message: 'Verify PAN and GSTIN with the live KYC check before submitting',
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

  const phone = profile.contactPhone || req.user.mobile;
  if (phone) {
    sendWhatsAppTemplate({
      mobile: phone,
      templateName: process.env.MSG91_WHATSAPP_TEMPLATE || 'kyc_submitted',
      bodyValues: [profile.businessName || 'Dealer', 'submitted'],
    }).catch(() => {});
  }

  await dispatchSafe({
    event: EVENTS.NEW_DEALER_KYC,
    title: 'New Dealer KYC',
    message: `${profile.businessName || req.user.dealershipName || req.user.name || 'A dealer'} submitted KYC for review`,
    entityId: profile._id,
    meta: { profileId: profile._id, dealerId: req.user._id },
    adminOnly: true,
  });

  res.json({ data: toPublic(profile), message: 'KYC submitted for review' });
};

exports.uploadDocument = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const type = req.body.type || 'other';
  const profile = await getOrCreate(req.user._id);
  if (profile.kycStatus === 'approved') {
    return res.status(400).json({ message: 'Approved KYC cannot be edited' });
  }

  profile.documents = profile.documents.filter((d) => d.type !== type);
  profile.documents.push({
    type,
    url: `/uploads/kyc/${req.file.filename}`,
    originalName: req.file.originalname,
    uploadedAt: new Date(),
  });
  if (profile.kycStatus === 'not_started') profile.kycStatus = 'draft';
  await profile.save();
  res.status(201).json({ data: toPublic(profile) });
};

exports.removeDocument = async (req, res) => {
  const profile = await getOrCreate(req.user._id);
  if (isLocked(profile)) {
    return res.status(400).json({ message: 'Documents are locked while KYC is under review' });
  }
  profile.documents = profile.documents.filter((d) => String(d._id) !== req.params.docId);
  await profile.save();
  res.json({ data: toPublic(profile) });
};

exports.listAll = async (req, res) => {
  const status = req.query.status;
  const filter = {};
  if (status) filter.kycStatus = status;
  const data = await DealerProfile.find(filter)
    .populate('user', 'name email mobile dealershipName city isActive')
    .sort('-updatedAt')
    .limit(100);
  res.json({ data: data.map(toPublic) });
};

exports.review = async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected', 'under_review'].includes(status)) {
    return res.status(400).json({ message: 'status must be approved, rejected, or under_review' });
  }
  const profile = await DealerProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ message: 'KYC profile not found' });

  profile.kycStatus = status;
  profile.reviewedBy = req.user._id;
  profile.reviewedAt = new Date();
  profile.rejectionReason = status === 'rejected' ? rejectionReason || 'Rejected by operations' : '';
  await profile.save();

  profile.kycVerified = status === 'approved';
  if (status === 'rejected') {
    profile.submittedAt = null;
    profile.onboardingStatus = 'REJECTED';
  }
  if (status === 'approved') profile.onboardingStatus = 'APPROVED';
  await profile.save();

  const user = await User.findById(profile.user);
  if (user) {
    user.isActive = status !== 'rejected';
    user.kycVerified = status === 'approved';
    if (profile.businessName) user.dealershipName = profile.businessName;
    if (profile.city) user.city = profile.city;
    await user.save();
    const phone = profile.contactPhone || user.mobile;
    if (phone) {
      sendWhatsAppTemplate({
        mobile: phone,
        templateName: process.env.MSG91_WHATSAPP_TEMPLATE || 'kyc_update',
        bodyValues: [profile.businessName || user.name || 'Dealer', status],
      }).catch(() => {});
    }
  }

  res.json({ data: toPublic(profile) });
};
