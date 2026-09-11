const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    avatar: { type: String, default: '' },
    preferredCity: { type: String, default: '', trim: true },
    preferredBrands: { type: [String], default: [] },
    preferredModels: { type: [String], default: [] },
    budgetMin: { type: Number, default: null },
    budgetMax: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
