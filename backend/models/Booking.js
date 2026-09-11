const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: [
        'Requested',
        'Confirmed',
        'Payment Pending',
        'Booked',
        'Token Received',
        'Financing Pending',
        'Fully Paid',
        'Cancelled',
        'Cancelled/Refunded',
        'Completed',
        'Refunded',
      ],
      default: 'Payment Pending',
      index: true,
    },
    paymentId: { type: String, default: '' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    notes: { type: String, default: '' },
    tokenAmount: { type: Number, default: null },
    deliveryDeadline: { type: Date, default: null },
    invoiceRef: { type: String, default: '' },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    saleAmount: { type: Number, default: null },
    invoiceHtml: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.pre('save', function assignRef(next) {
  if (!this.bookingRef) {
    this.bookingRef = `4TZ${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
