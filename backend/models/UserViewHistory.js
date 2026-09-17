const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    price: { type: Number, default: null },
    thumb: { type: String, default: '' },
    km: { type: Number, default: null },
    fuel: { type: String, default: '' },
    transmission: { type: String, default: '' },
    city: { type: String, default: '' },
  },
  { _id: false }
);

const userViewHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    viewedAt: { type: Date, default: Date.now, index: true },
    snapshot: { type: snapshotSchema, default: {} },
  },
  { timestamps: true }
);

userViewHistorySchema.index({ user: 1, vehicle: 1 }, { unique: true });
userViewHistorySchema.index({ user: 1, viewedAt: -1 });

module.exports = mongoose.model('UserViewHistory', userViewHistorySchema);
