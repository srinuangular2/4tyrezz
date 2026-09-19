const User = require('../models/User');
const DealerProfile = require('../models/DealerProfile');

function sanitize(user, extra = {}) {
  const {
    _id, name, mobile, email, role, avatar, city, dealershipName, isVerified, profileComplete, googleId,
    kycVerified, dealerCode,
  } = user;
  return {
    id: _id,
    name,
    mobile,
    email,
    role,
    avatar,
    city,
    dealershipName,
    dealerCode: dealerCode || '',
    isVerified,
    profileComplete,
    googleConnected: !!googleId,
    kycVerified: !!kycVerified,
    ...extra,
  };
}

exports.updateMe = async (req, res) => {
  try {
    const { name, city, dealershipName, email } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = String(name).trim();
    if (city !== undefined) user.city = String(city).trim();
    if (user.role === 'dealer' && dealershipName !== undefined) {
      user.dealershipName = String(dealershipName).trim();
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (normalized && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return res.status(400).json({ message: 'Enter a valid email address' });
      }
      if (normalized) {
        const existing = await User.findOne({ email: normalized, _id: { $ne: user._id } });
        if (existing) return res.status(400).json({ message: 'Email already in use' });
        user.email = normalized;
      }
    }

    if (user.name && (user.email || user.mobile || user.dealerCode)) user.profileComplete = true;
    await user.save();

    let extra = {};
    if (user.role === 'dealer') {
      const profile = await DealerProfile.findOne({ user: user._id });
      if (profile) {
        if (name !== undefined) profile.contactPerson = user.name;
        if (city !== undefined) profile.city = user.city;
        if (dealershipName !== undefined) profile.businessName = user.dealershipName;
        if (email !== undefined) profile.contactEmail = user.email || '';
        await profile.save();
        extra = { kycStatus: profile.kycStatus, kycVerified: Boolean(profile.kycVerified) };
      }
    }

    res.json({ success: true, user: sanitize(user, extra) });
  } catch (error) {
    console.error('updateMe error:', error);
    res.status(500).json({ message: 'Could not update profile' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: sanitize(req.user) });
};
