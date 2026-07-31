const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    mobile: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, index: true },
    password: { type: String, select: false }, // only for dealer/admin
    role: { type: String, enum: ['customer', 'dealer', 'admin'], default: 'customer' },
    avatar: { type: String, default: '' },
    city: { type: String, default: '' },
    dealershipName: { type: String, default: '' },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
