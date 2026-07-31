const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const isMock = () => process.env.MOCK_OTP !== 'false';

// ---- Customer: mobile + OTP ----
exports.requestOtp = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
  }

  const otp = isMock() ? '123456' : String(Math.floor(100000 + Math.random() * 900000));
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  let user = await User.findOne({ mobile });
  if (!user) user = new User({ mobile, role: 'customer' });
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  if (!isMock()) {
    // TODO: integrate Twilio/Firebase here to actually send `otp` to `mobile`.
  }

  res.json({
    success: true,
    message: isMock() ? 'Mock OTP generated (dev mode)' : 'OTP sent',
    devOtp: isMock() ? otp : undefined,
  });
};

exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;
  const user = await User.findOne({ mobile }).select('+otp +otpExpires');
  if (!user || !user.otp || user.otp !== otp || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  user.otp = undefined;
  user.otpExpires = undefined;
  user.isVerified = true;
  await user.save();

  res.json({ success: true, token: generateToken(user), user: sanitize(user) });
};

// ---- Dealer / Admin: email + password ----
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: { $in: ['dealer', 'admin'] } }).select('+password');
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) return res.status(403).json({ message: 'Account is disabled' });

  res.json({ success: true, token: generateToken(user), user: sanitize(user) });
};

exports.registerDealer = async (req, res) => {
  const { name, email, password, dealershipName, city } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, dealershipName, city, role: 'dealer' });
  res.status(201).json({ success: true, token: generateToken(user), user: sanitize(user) });
};

exports.me = async (req, res) => {
  res.json({ user: sanitize(req.user) });
};

function sanitize(user) {
  const { _id, name, mobile, email, role, avatar, city, dealershipName, isVerified } = user;
  return { id: _id, name, mobile, email, role, avatar, city, dealershipName, isVerified };
}
