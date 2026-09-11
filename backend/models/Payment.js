const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'neft', 'cash', 'razorpay', 'other'],
      default: 'razorpay',
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    provider: { type: String, default: 'razorpay' },
    providerOrderId: { type: String, default: '' },
    providerPaymentId: { type: String, default: '' },
    invoiceRef: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
