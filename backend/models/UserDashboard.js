const mongoose = require('mongoose');
const Wishlist = require('./Wishlist');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['purchase', 'inspection', 'evaluation', 'token_payment'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    status: { type: String, default: 'Requested', index: true },
    amount: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', default: null },
    refId: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['test_drive', 'valuation', 'enquiry', 'order', 'wishlist', 'garage', 'kyc', 'other'],
      default: 'other',
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const garageVehicleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    brand: { type: String, default: '', trim: true },
    model: { type: String, default: '', trim: true },
    variant: { type: String, default: '', trim: true },
    year: { type: Number, default: null },
    registrationNumber: { type: String, default: '', uppercase: true, trim: true },
    fuel: { type: String, default: '' },
    lastServiceAt: { type: Date, default: null },
    lastServiceNotes: { type: String, default: '' },
    rtoNotes: { type: String, default: '' },
    insuranceExpiry: { type: Date, default: null },
    status: { type: String, enum: ['owned', 'sold', 'archived'], default: 'owned' },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
garageVehicleSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const UserActivity = mongoose.models.UserActivity || mongoose.model('UserActivity', activitySchema);
const GarageVehicle = mongoose.models.GarageVehicle || mongoose.model('GarageVehicle', garageVehicleSchema);

async function recordActivity(userId, payload) {
  if (!userId || !payload?.title) return null;
  try {
    return await UserActivity.create({
      user: userId,
      type: payload.type || 'other',
      title: payload.title,
      body: payload.body || '',
      link: payload.link || '',
      meta: payload.meta || {},
    });
  } catch (err) {
    console.warn('[activity] skip:', err.message);
    return null;
  }
}

module.exports = { Order, Wishlist, UserActivity, GarageVehicle, recordActivity };
