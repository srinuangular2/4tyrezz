const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    mobile: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, index: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['customer', 'dealer', 'admin'], default: 'customer' },
    avatar: { type: String, default: '' },
    city: { type: String, default: '' },
    dealershipName: { type: String, default: '' },
    otp: { type: String, select: false }, // bcrypt hash, never the plain code
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpLastSentAt: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    googleId: { type: String, default: '', sparse: true, index: true },
    profileComplete: { type: Boolean, default: false },
    kycVerified: { type: Boolean, default: false, index: true },
    mobileVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false, default: '' },
    emailVerifyExpires: { type: Date, select: false, default: null },
    passwordResetToken: { type: String, select: false, default: '' },
    passwordResetExpires: { type: Date, select: false, default: null },
    isVerified: { type: Boolean, default: false },
    consents: {
      whatsappUpdates: { type: Boolean, default: false },
      marketingSms: { type: Boolean, default: false },
      dataSharing: { type: Boolean, default: false },
      wishlistPriceDrop: { type: Boolean, default: true },
      wishlistAvailability: { type: Boolean, default: true },
    },
    addresses: {
      type: [
        {
          label: { type: String, default: 'Home' },
          line1: { type: String, default: '' },
          line2: { type: String, default: '' },
          city: { type: String, default: '' },
          state: { type: String, default: '' },
          pincode: { type: String, default: '' },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
