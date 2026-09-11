const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    salePrice: { type: Number, required: true },
    ratePercent: { type: Number, default: 2.5 },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: { type: String, default: '' },
    settledAt: { type: Date, default: null },
    settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    payoutRef: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Commission', commissionSchema);
