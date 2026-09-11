const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { getPermissionsForUser } = require('../utils/rbacBootstrap');
const DealerProfile = require('../models/DealerProfile');
const { sendOTP, sendWhatsAppTemplate } = require('../services/integrations/msg91Service');
const {
  isOtpDevelopment,
  sanitizeMobile,
  generateDynamicOtp,
  logDevOtpBanner,
  otpMode,
} = require('../utils/otpMode');
const { validateEmail, validateMobile, validatePan, validateGstin } = require('../utils/kycValidators');
const { readMobileToken } = require('../utils/dealerMobileToken');
const { createToken, hashToken, issueDevLink } = require('../utils/accountTokens');

const OTP_LENGTH = 4;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

const otpMemory = new Map();

function readMobile(req) {
  return sanitizeMobile(req.body?.mobileNumber || req.body?.mobile || req.body?.phone);
}

const isMockGoogle = () => process.env.MOCK_GOOGLE !== 'false';

async function sanitize(user) {
  const permissions = await getPermissionsForUser(user);
  const {
    _id, name, mobile, email, role, avatar, city, dealershipName, isVerified, profileComplete, googleId,
    kycVerified, mobileVerified, consents,
  } = user;
  const out = {
    id: _id,
    name,
    mobile,
    email,
    role,
    avatar,
    city,
    dealershipName,
    isVerified,
    profileComplete,
    googleConnected: !!googleId,
    kycVerified: !!kycVerified,
    mobileVerified: !!mobileVerified,
    consents: consents || { whatsappUpdates: false, marketingSms: false, dataSharing: false },
    permissions,
  };
  if (role === 'dealer') {
    const profile = await DealerProfile.findOne({ user: _id }).select('kycStatus kycVerified panVerified gstVerified');
    out.kycStatus = profile?.kycStatus || 'PENDING_KYC_APPROVAL';
    out.kycVerified = Boolean(profile?.kycVerified || profile?.kycStatus === 'approved' || kycVerified);
    out.panVerified = !!profile?.panVerified;
    out.gstVerified = !!profile?.gstVerified;
  }
  if (role === 'customer') {
    out.emailVerified = Boolean(user.emailVerified);
    out.mobileVerified = Boolean(user.mobileVerified || user.isVerified);
  }
  return out;
}

function needsProfile(user) {
  return !user.profileComplete && (!user.name || !user.email);
}

async function verifyGoogleCredential(credential) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
  if (!res.ok) throw new Error('Invalid Google credential');
  const payload = await res.json();
  if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google token audience mismatch');
  }
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.given_name || '',
    avatar: payload.picture || '',
  };
}

// ---- Customer: mobile + OTP ----
exports.requestOtp = async (req, res) => {
  try {
    const mobile = readMobile(req);
    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
    }

    const purpose = String(req.body.purpose || 'login');
    if (purpose === 'register') {
      const prev = otpMemory.get(mobile);
      if (prev && Date.now() - (prev.sentAt || 0) < OTP_RESEND_COOLDOWN_MS && !isOtpDevelopment()) {
        return res.status(429).json({ message: 'Wait a few seconds before requesting another OTP' });
      }
      const dynamicOtp = generateDynamicOtp();
      otpMemory.set(mobile, { otp: dynamicOtp, expires: Date.now() + OTP_TTL_MS, sentAt: Date.now(), purpose: 'register' });
      if (isOtpDevelopment()) logDevOtpBanner(mobile, dynamicOtp);
      else sendOTP({ mobile, otp: dynamicOtp }).catch(() => {});
      return res.json({
        success: true,
        message: 'OTP sent successfully',
        mobile,
        otpLength: OTP_LENGTH,
        expiresIn: OTP_TTL_MS / 1000,
        ...(isOtpDevelopment() ? { devOtp: dynamicOtp, otpMode: otpMode() } : {}),
      });
    }

    let user = await User.findOne({ mobile }).select('+otpLastSentAt');
    if (!user) user = new User({ mobile, role: 'customer' });

    if (
      !isOtpDevelopment() &&
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      const waitFor = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (Date.now() - user.otpLastSentAt.getTime())) / 1000
      );
      return res.status(429).json({ message: `Please wait ${waitFor}s before requesting a new OTP`, retryAfter: waitFor });
    }

    const dynamicOtp = generateDynamicOtp();

    user.otp = await bcrypt.hash(dynamicOtp, 10);
    user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    otpMemory.set(mobile, { otp: dynamicOtp, expires: Date.now() + OTP_TTL_MS });

    if (isOtpDevelopment()) {
      logDevOtpBanner(mobile, dynamicOtp);
    } else {
      await sendOTP({ mobile, otp: dynamicOtp });
    }

    const payload = {
      success: true,
      message: 'OTP sent successfully',
      mobile,
      otpLength: OTP_LENGTH,
      expiresIn: OTP_TTL_MS / 1000,
      resendAfter: isOtpDevelopment() ? 0 : OTP_RESEND_COOLDOWN_MS / 1000,
    };
    if (isOtpDevelopment()) {
      payload.devOtp = dynamicOtp;
      payload.otpMode = otpMode();
    }
    res.json(payload);
  } catch (error) {
    console.error('requestOtp error:', error);
    res.status(500).json({ message: 'Could not send OTP. Please try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const mobile = readMobile(req);
    const submitted = String(req.body?.otp || '').replace(/\D/g, '');
    if (!mobile || mobile.length !== 10 || !submitted) {
      return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    const stored = otpMemory.get(mobile);
    const memOk = Boolean(stored && stored.expires > Date.now() && stored.otp === submitted);
    if (String(req.body.purpose || '') === 'register' && memOk) {
      otpMemory.delete(mobile);
      return res.json({
        success: true,
        mobile,
        mobileVerifiedToken: require('../utils/dealerMobileToken').issueMobileToken(mobile),
      });
    }

    const user = await User.findOne({ mobile }).select('+otp +otpExpires +otpAttempts');
    const hashOk =
      user?.otp &&
      user.otpExpires &&
      user.otpExpires >= new Date() &&
      (await bcrypt.compare(submitted, user.otp));

    if (!memOk && !hashOk) {
      const expired = !stored || stored.expires <= Date.now();
      if (!user || !user.otp || !user.otpExpires || user.otpExpires < new Date() || expired) {
        return res.status(400).json({ message: 'This OTP has expired or does not match. Please request a new one.' });
      }
      if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        otpMemory.delete(mobile);
        return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
      }
      user.otpAttempts += 1;
      await user.save();
      const left = OTP_MAX_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        message: left > 0 ? `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect OTP.',
        attemptsLeft: Math.max(left, 0),
      });
    }

    let account = user;
    if (!account) {
      account = await User.create({ mobile, role: 'customer', isVerified: true });
    }

    account.otp = undefined;
    account.otpExpires = undefined;
    account.otpAttempts = 0;
    account.isVerified = true;
    account.mobileVerified = true;
    await account.save();
    otpMemory.delete(mobile);

    const safeUser = await sanitize(account);
    res.json({
      success: true,
      token: generateToken(account, safeUser.permissions),
      user: safeUser,
      needsProfile: needsProfile(account),
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ message: 'Could not verify OTP. Please try again.' });
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    if (email) {
      const normalized = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return res.status(400).json({ message: 'Enter a valid email address' });
      }
      const existing = await User.findOne({ email: normalized, _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: 'This email is already linked to another account' });
      user.email = normalized;
    }

    if (name) user.name = String(name).trim();
    if (user.name && user.email) user.profileComplete = true;
    await user.save();

    const safeUser = await sanitize(user);
    res.json({
      success: true,
      user: safeUser,
      token: generateToken(user, safeUser.permissions),
      needsProfile: needsProfile(user),
    });
  } catch (error) {
    console.error('completeProfile error:', error);
    res.status(500).json({ message: 'Could not update profile' });
  }
};

exports.connectGoogle = async (req, res) => {
  try {
    const { credential, email, name, googleId, avatar } = req.body;
    let profile;

    if (credential) {
      profile = await verifyGoogleCredential(credential);
    } else if (isMockGoogle() && email && googleId) {
      profile = {
        googleId,
        email: String(email).trim().toLowerCase(),
        name: name || '',
        avatar: avatar || '',
      };
    } else {
      return res.status(400).json({ message: 'Google sign-in failed. Please try again.' });
    }

    const user = req.user;
    const existing = await User.findOne({ email: profile.email, _id: { $ne: user._id } });
    if (existing) return res.status(400).json({ message: 'This Google account is already linked to another user' });

    user.googleId = profile.googleId;
    user.email = profile.email;
    if (profile.name && !user.name) user.name = profile.name;
    if (profile.avatar) user.avatar = profile.avatar;
    if (user.name && user.email) user.profileComplete = true;
    await user.save();

    const safeUser = await sanitize(user);
    res.json({
      success: true,
      user: safeUser,
      token: generateToken(user, safeUser.permissions),
      needsProfile: needsProfile(user),
    });
  } catch (error) {
    console.error('connectGoogle error:', error);
    res.status(400).json({ message: error.message || 'Google connection failed' });
  }
};

exports.skipProfile = async (req, res) => {
  try {
    const user = req.user;
    user.profileComplete = true;
    await user.save();
    const safeUser = await sanitize(user);
    res.json({
      success: true,
      user: safeUser,
      token: generateToken(user, safeUser.permissions),
      needsProfile: false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not skip profile step' });
  }
};

exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, password, city, mobile, mobileVerifiedToken } = req.body;
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: 'Name, email, password and mobile are required' });
    }
    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });
    const mobileCheck = validateMobile(mobile);
    if (!mobileCheck.ok) return res.status(400).json({ message: mobileCheck.message });
    const verifiedMobile = readMobileToken(mobileVerifiedToken);
    if (!verifiedMobile || verifiedMobile !== mobileCheck.value) {
      return res.status(400).json({ message: 'Verify your mobile number with OTP before creating the account' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const exists = await User.findOne({ $or: [{ email: emailCheck.value }, { mobile: mobileCheck.value }] });
    if (exists) {
      if (exists.role !== 'customer' || exists.password) {
        return res.status(400).json({ message: 'Email or mobile already registered' });
      }
    }
    const hashed = await bcrypt.hash(password, 10);
    const verify = createToken(24 * 60 * 60 * 1000);
    const user = exists || new User({ mobile: mobileCheck.value, role: 'customer' });
    user.name = String(name).trim();
    user.email = emailCheck.value;
    user.password = hashed;
    user.city = city ? String(city).trim() : '';
    user.role = 'customer';
    user.mobileVerified = true;
    user.isVerified = true;
    user.emailVerified = false;
    user.emailVerifyToken = verify.hash;
    user.emailVerifyExpires = verify.expires;
    user.profileComplete = true;
    user.isActive = true;
    await user.save();

    const UserProfile = require('../models/UserProfile');
    await UserProfile.findOneAndUpdate(
      { user: user._id },
      { preferredCity: user.city },
      { upsert: true, new: true }
    );

    const safeUser = await sanitize(user);
    res.status(201).json({
      success: true,
      token: generateToken(user, safeUser.permissions),
      user: safeUser,
      verifyEmailUrl: isOtpDevelopment() ? issueDevLink('verify', verify.raw) : undefined,
      message: 'Account created. Verify your email from the link we issued.',
    });
  } catch (err) {
    console.error('registerCustomer error:', err);
    res.status(500).json({ message: err.message || 'Could not register' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() }).select('+password');
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) return res.status(403).json({ message: 'Account is disabled' });
  if (user.role === 'customer' && !user.mobileVerified && !user.isVerified) {
    return res.status(403).json({ message: 'Verify your mobile number before signing in' });
  }

  const safeUser = await sanitize(user);
  res.json({ success: true, token: generateToken(user, safeUser.permissions), user: safeUser });
};

exports.forgotPassword = async (req, res) => {
  const emailCheck = validateEmail(req.body.email);
  if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });
  const user = await User.findOne({ email: emailCheck.value, role: 'customer' });
  const payload = { success: true, message: 'If that email is registered, a reset link has been issued.' };
  if (!user) return res.json(payload);
  const token = createToken(30 * 60 * 1000);
  user.passwordResetToken = token.hash;
  user.passwordResetExpires = token.expires;
  await user.save();
  if (isOtpDevelopment()) payload.resetUrl = issueDevLink('reset', token.raw);
  res.json(payload);
};

exports.resetPassword = async (req, res) => {
  const raw = String(req.body.token || '').trim();
  const password = String(req.body.password || '');
  if (!raw || password.length < 8) {
    return res.status(400).json({ message: 'Valid token and a password of at least 8 characters are required' });
  }
  const user = await User.findOne({
    passwordResetToken: hashToken(raw),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +password');
  if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });
  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = '';
  user.passwordResetExpires = null;
  await user.save();
  res.json({ success: true, message: 'Password updated. You can sign in now.' });
};

exports.verifyEmail = async (req, res) => {
  const raw = String(req.query.token || req.body.token || '').trim();
  if (!raw) return res.status(400).json({ message: 'Verification token is required' });
  const user = await User.findOne({
    emailVerifyToken: hashToken(raw),
    emailVerifyExpires: { $gt: new Date() },
  }).select('+emailVerifyToken +emailVerifyExpires');
  if (!user) return res.status(400).json({ message: 'Verification link is invalid or expired' });
  user.emailVerified = true;
  user.emailVerifyToken = '';
  user.emailVerifyExpires = null;
  await user.save();
  const safeUser = await sanitize(user);
  res.json({ success: true, user: safeUser, message: 'Email verified' });
};

exports.resendVerification = async (req, res) => {
  if (!req.user.email) return res.status(400).json({ message: 'Add an email to your profile first' });
  const token = createToken(24 * 60 * 60 * 1000);
  req.user.emailVerifyToken = token.hash;
  req.user.emailVerifyExpires = token.expires;
  await req.user.save();
  res.json({
    success: true,
    message: 'Verification link issued',
    verifyEmailUrl: isOtpDevelopment() ? issueDevLink('verify', token.raw) : undefined,
  });
};

exports.registerDealer = async (req, res) => {
  try {
    const { name, email, password, dealershipName, city, mobile, gstNumber, panNumber, businessType, mobileVerifiedToken } = req.body;
    if (!name || !email || !password || !dealershipName) {
      return res.status(400).json({ message: 'Name, email, password and dealership name are required' });
    }
    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });
    const mobileCheck = validateMobile(mobile);
    if (!mobileCheck.ok) return res.status(400).json({ message: mobileCheck.message });
    const verifiedMobile = readMobileToken(mobileVerifiedToken);
    if (!verifiedMobile || verifiedMobile !== mobileCheck.value) {
      return res.status(400).json({ message: 'Verify your mobile number with OTP before registering' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    let pan = '';
    let gst = '';
    if (panNumber) {
      const panCheck = validatePan(panNumber);
      if (!panCheck.ok) return res.status(400).json({ message: panCheck.message, field: 'panNumber' });
      pan = panCheck.value;
    }
    if (gstNumber) {
      const gstCheck = validateGstin(gstNumber, pan || panNumber);
      if (!gstCheck.ok) return res.status(400).json({ message: gstCheck.message, field: 'gstNumber' });
      gst = gstCheck.value;
    }

    const exists = await User.findOne({ $or: [{ email: emailCheck.value }, { mobile: mobileCheck.value }] });
    if (exists) return res.status(400).json({ message: 'Email or mobile already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: emailCheck.value,
      mobile: mobileCheck.value,
      password: hashed,
      dealershipName: String(dealershipName).trim(),
      city: city ? String(city).trim() : '',
      role: 'dealer',
      profileComplete: true,
      mobileVerified: true,
      kycVerified: false,
    });

    await DealerProfile.create({
      user: user._id,
      businessName: String(dealershipName).trim(),
      businessType: businessType || '',
      gstNumber: gst,
      panNumber: pan,
      city: city ? String(city).trim() : '',
      contactPerson: String(name).trim(),
      contactPhone: mobileCheck.value,
      contactEmail: emailCheck.value,
      kycStatus: 'draft',
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: 2,
      kycVerified: false,
      mobileVerified: true,
      panVerified: false,
      gstVerified: false,
    });

    sendWhatsAppTemplate({
      mobile: mobileCheck.value,
      templateName: process.env.MSG91_WHATSAPP_TEMPLATE || 'dealer_welcome',
      bodyValues: [dealershipName],
    }).catch(() => {});

    const safeUser = await sanitize(user);
    res.status(201).json({
      success: true,
      token: generateToken(user, safeUser.permissions),
      user: safeUser,
      kycRequired: true,
      kycVerified: false,
    });
  } catch (err) {
    console.error('registerDealer error:', err);
    res.status(500).json({ message: err.message || 'Could not register dealer' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: await sanitize(req.user), needsProfile: needsProfile(req.user) });
};
