const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['boost', 'package', 'offer', 'campaign', 'featured'],
      default: 'offer',
    },
    code: { type: String, default: '' },
    discountPercent: { type: Number, default: null },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    targetDealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Promotion', promotionSchema);
