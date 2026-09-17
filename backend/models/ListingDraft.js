const mongoose = require('mongoose');

const listingDraftSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['sell', 'valuation'], required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

listingDraftSchema.index({ user: 1, kind: 1 }, { unique: true });

module.exports = mongoose.model('ListingDraft', listingDraftSchema);
