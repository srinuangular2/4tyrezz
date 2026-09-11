const mongoose = require('mongoose');

const promotionCampaignSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    plan: { type: String, enum: ['hot_deal', 'sponsored', 'featured'], default: 'featured' },
    label: { type: String, default: 'Featured' },
    durationDays: { type: Number, default: 7 },
    price: { type: Number, default: 499 },
    startAt: { type: Date, default: Date.now },
    endAt: { type: Date },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'expired', 'paused'], default: 'active', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromotionCampaign', promotionCampaignSchema);
