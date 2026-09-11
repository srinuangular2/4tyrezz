const DealerProfile = require('../models/DealerProfile');
const User = require('../models/User');
const Car = require('../models/Car');
const Lead = require('../models/Lead');
const Commission = require('../models/Commission');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { sendWhatsAppTemplate } = require('../services/integrations/msg91Service');
const { validatePan, validateGstin, validateIfsc } = require('../utils/kycValidators');
const { syncFromListingStatus } = require('../utils/listingStatus');

const PENDING = ['PENDING_KYC_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'submitted', 'under_review'];

function checks(profile) {
  const pan = validatePan(profile.panNumber || '');
  const gst = validateGstin(profile.gstNumber || '', profile.panNumber || '');
  const ifsc = profile.bankIfsc ? validateIfsc(profile.bankIfsc) : { ok: false, message: 'IFSC not provided' };
  return {
    pan: { ok: pan.ok, value: profile.panNumber || '', message: pan.ok ? 'Valid PAN format' : pan.message },
    gst: { ok: gst.ok, value: profile.gstNumber || '', message: gst.ok ? 'Valid GSTIN format' : gst.message },
    ifsc: { ok: ifsc.ok, value: profile.bankIfsc || '', message: ifsc.ok ? 'Valid IFSC format' : ifsc.message },
  };
}

function serialize(profile) {
  const obj = profile.toObject ? profile.toObject({ virtuals: true }) : profile;
  return { ...obj, checks: checks(obj) };
}

exports.listPending = async (_req, res) => {
  const data = await DealerProfile.find({ kycStatus: { $in: PENDING } })
    .populate('user', 'name email mobile dealershipName city isActive')
    .sort('-updatedAt')
    .limit(100);
  res.json({ data: data.map(serialize) });
};

exports.listDealers = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const userFilter = { role: 'dealer' };
  if (req.query.search) {
    userFilter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
      { dealershipName: new RegExp(req.query.search, 'i') },
      { city: new RegExp(req.query.search, 'i') },
    ];
  }
  const users = await User.find(userFilter).select('-password -otp -otpExpires').sort('-createdAt');
  const profiles = await DealerProfile.find({ user: { $in: users.map((u) => u._id) } });
  const byUser = Object.fromEntries(profiles.map((p) => [String(p.user), p]));
  const merged = [];
  for (const user of users) {
    let profile = byUser[String(user._id)];
    if (!profile) {
      profile = await DealerProfile.create({
        user: user._id,
        businessName: user.dealershipName || '',
        contactPerson: user.name || '',
        contactPhone: user.mobile || '',
        contactEmail: user.email || '',
        city: user.city || '',
        kycStatus: 'not_started',
      });
    }
    const obj = profile.toObject({ virtuals: true });
    obj.user = user;
    if (req.query.kycStatus && obj.kycStatus !== req.query.kycStatus) continue;
    merged.push(serialize(obj));
  }
  const total = merged.length;
  const start = (page - 1) * limit;
  res.json({ data: merged.slice(start, start + limit), total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.getDealer = async (req, res) => {
  const profile = await DealerProfile.findById(req.params.id).populate(
    'user',
    'name email mobile dealershipName city isActive kycVerified'
  );
  if (!profile) return res.status(404).json({ message: 'Dealer profile not found' });
  res.json({ data: serialize(profile) });
};

exports.performance = async (req, res) => {
  const profile = await DealerProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ message: 'Dealer profile not found' });
  const dealerId = profile.user;
  const [inventory, sold, leads, commissionsPaid, ratingAgg] = await Promise.all([
    Car.countDocuments({ owner: dealerId }),
    Car.countDocuments({ owner: dealerId, status: 'sold' }),
    Lead.countDocuments({ seller: dealerId }),
    Commission.aggregate([
      { $match: { dealer: dealerId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Review.aggregate([
      { $match: { dealer: dealerId, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);
  res.json({
    data: {
      inventory,
      sold,
      leads,
      commissionsPaid: commissionsPaid[0]?.total || 0,
      rating: ratingAgg[0]?.avg ? Math.round(ratingAgg[0].avg * 10) / 10 : null,
      reviewCount: ratingAgg[0]?.count || 0,
      avgLeadResponseHours: null,
    },
  });
};

async function notifyDealer(user, title, body) {
  if (!user) return;
  await Notification.create({ user: user._id, title, body, type: 'approval' });
  const phone = user.mobile;
  if (phone) {
    sendWhatsAppTemplate({
      mobile: phone,
      templateName: process.env.MSG91_WHATSAPP_TEMPLATE || 'kyc_update',
      bodyValues: [user.dealershipName || user.name || 'Dealer', title],
    }).catch(() => {});
  }
  if (user.email) {
    console.log(`[admin:email:stub] ${user.email} — ${title}: ${body}`);
  }
}

exports.setStatus = async (req, res) => {
  const action = String(req.body.action || req.body.status || '').toLowerCase();
  const profile = await DealerProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ message: 'Dealer profile not found' });
  const user = await User.findById(profile.user);
  if (!user) return res.status(404).json({ message: 'Dealer account not found' });

  if (action === 'approve' || action === 'approved') {
    profile.kycStatus = 'approved';
    profile.kycVerified = true;
    profile.onboardingStatus = 'APPROVED';
    profile.rejectionReason = '';
    profile.reviewedBy = req.user._id;
    profile.reviewedAt = new Date();
    user.isActive = true;
    user.kycVerified = true;
    if (profile.businessName) user.dealershipName = profile.businessName;
    await profile.save();
    await user.save();
    await notifyDealer(user, 'Dealer approved', 'Your KYC is approved. You can now publish inventory on 4TYREZZ.');
    return res.json({ data: serialize(profile) });
  }

  if (action === 'reject' || action === 'rejected') {
    const reason = req.body.rejectionReason || req.body.reason || 'Rejected by operations';
    profile.kycStatus = 'rejected';
    profile.kycVerified = false;
    profile.onboardingStatus = 'REJECTED';
    profile.rejectionReason = reason;
    profile.reviewedBy = req.user._id;
    profile.reviewedAt = new Date();
    profile.submittedAt = null;
    user.kycVerified = false;
    await profile.save();
    await user.save();
    await notifyDealer(user, 'KYC rejected', reason);
    return res.json({ data: serialize(profile) });
  }

  if (action === 'suspend') {
    user.isActive = false;
    await user.save();
    const cars = await Car.find({ owner: user._id, status: 'approved', unpublished: { $ne: true } });
    await Promise.all(
      cars.map((car) => {
        Object.assign(car, syncFromListingStatus('UNPUBLISHED', car));
        return car.save();
      })
    );
    await notifyDealer(user, 'Account suspended', req.body.reason || 'Your dealer account has been suspended.');
    return res.json({ data: serialize(await DealerProfile.findById(profile._id).populate('user', 'name email isActive')) });
  }

  if (action === 'reactivate') {
    user.isActive = true;
    await user.save();
    await notifyDealer(user, 'Account reactivated', 'Your dealer account is active again.');
    return res.json({ data: serialize(await DealerProfile.findById(profile._id).populate('user', 'name email isActive')) });
  }

  return res.status(400).json({ message: 'action must be approve, reject, suspend, or reactivate' });
};
