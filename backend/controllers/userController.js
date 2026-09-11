const User = require('../models/User');

function sanitize(user) {
  const {
    _id, name, mobile, email, role, avatar, city, dealershipName, isVerified, profileComplete, googleId,
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
    isVerified,
    profileComplete,
    googleConnected: !!googleId,
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

    if (email !== undefined && user.role === 'customer') {
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

    if (user.name && (user.email || user.mobile)) user.profileComplete = true;
    await user.save();

    res.json({ success: true, user: sanitize(user) });
  } catch (error) {
    console.error('updateMe error:', error);
    res.status(500).json({ message: 'Could not update profile' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: sanitize(req.user) });
};
