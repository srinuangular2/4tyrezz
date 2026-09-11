const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
