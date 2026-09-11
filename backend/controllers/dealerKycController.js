const bcrypt = require('bcryptjs');
const DealerProfile = require('../models/DealerProfile');
const { sendOTP } = require('../services/integrations/msg91Service');
const { verifyKycDocuments } = require('../services/integrations/kycVerifyService');
const { recordActivity } = require('../models/UserDashboard');
const { issueMobileToken, readMobileToken } = require('../utils/dealerMobileToken');
const {
  validatePan,
  validateGstin,
  validateMobile,
  validateEmail,
  normalizeMobile,
} = require('../utils/kycValidators');
const {
  isOtpDevelopment,
  generateDynamicOtp,
  logDevOtpBanner,
  otpMode,
} = require('../utils/otpMode');

const dealerOtp = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 30 * 1000;

exports.requestDealerOtp = async (req, res) => {
  const check = validateMobile(req.body.mobile || req.body.mobileNumber);
  if (!check.ok) return res.status(400).json({ message: check.message });
  const mobile = check.value;
  const prev = dealerOtp.get(mobile);
  if (prev && Date.now() - prev.sentAt < OTP_RESEND_MS) {
    return res.status(429).json({ message: 'Wait a few seconds before requesting another OTP' });
  }
  const code = generateDynamicOtp();
  const hash = await bcrypt.hash(code, 8);
  dealerOtp.set(mobile, { hash, expires: Date.now() + OTP_TTL_MS, sentAt: Date.now(), attempts: 0 });
  if (isOtpDevelopment()) logDevOtpBanner(mobile, code);
  else {
    sendOTP({ mobile, otp: code }).catch((err) => console.warn('[dealer-otp]', err.message));
  }
  res.json({
    success: true,
    message: 'OTP sent',
    mobile,
    otpMode: otpMode(),
    ...(isOtpDevelopment() ? { devOtp: code } : {}),
  });
};

exports.verifyDealerOtp = async (req, res) => {
  const check = validateMobile(req.body.mobile || req.body.mobileNumber);
  if (!check.ok) return res.status(400).json({ message: check.message });
  const otp = String(req.body.otp || '').trim();
  if (!/^\d{4}$/.test(otp)) return res.status(400).json({ message: 'Enter the 4-digit OTP' });
  const row = dealerOtp.get(check.value);
  if (!row || Date.now() > row.expires) {
    return res.status(400).json({ message: 'OTP expired. Request a new one.' });
  }
  if (row.attempts >= 5) return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
  const ok = await bcrypt.compare(otp, row.hash);
  row.attempts += 1;
  if (!ok) return res.status(400).json({ message: 'Invalid OTP' });
  dealerOtp.delete(check.value);
  res.json({
    success: true,
    mobile: check.value,
    mobileVerifiedToken: issueMobileToken(check.value),
  });
};

exports.verifyKyc = async (req, res) => {
  const panNumber = req.body.panNumber || req.body.pan;
  const gstNumber = req.body.gstNumber || req.body.gstin || req.body.gst;
  if (!panNumber && !gstNumber) {
    return res.status(400).json({ message: 'PAN or GSTIN is required' });
  }
  if (panNumber) {
    const pan = validatePan(panNumber);
    if (!pan.ok) return res.status(400).json({ success: false, field: 'panNumber', message: pan.message });
  }
  if (gstNumber) {
    const gst = validateGstin(gstNumber, panNumber);
    if (!gst.ok) return res.status(400).json({ success: false, field: 'gstNumber', message: gst.message });
  }

  const result = await verifyKycDocuments({ panNumber, gstNumber });
  if (!result.success) {
    const failed = result.pan && !result.pan.ok ? result.pan : result.gst;
    return res.status(400).json({
      success: false,
      message: failed?.message || 'KYC numbers could not be verified',
      pan: result.pan,
      gst: result.gst,
    });
  }

  if (req.user?.role === 'dealer') {
    const profile = await DealerProfile.findOne({ user: req.user._id });
    if (profile) {
      if (result.pan?.ok) {
        profile.panNumber = result.pan.value;
        profile.panVerified = true;
        profile.panVerifiedAt = new Date();
      }
      if (result.gst?.ok) {
        profile.gstNumber = result.gst.value;
        profile.gstVerified = true;
        profile.gstVerifiedAt = new Date();
      }
      await profile.save();
    }
    await recordActivity(req.user._id, { type: 'kyc', title: 'KYC numbers verified' });
  }

  res.json({
    success: true,
    pan: result.pan,
    gst: result.gst,
  });
};

exports.assertDealerMobile = (req) => {
  const token = req.body.mobileVerifiedToken;
  const mobile = normalizeMobile(req.body.mobile);
  const fromToken = readMobileToken(token);
  if (!fromToken || fromToken !== mobile) {
    const err = new Error('Verify your mobile number with OTP before registering');
    err.status = 400;
    throw err;
  }
  return mobile;
};
