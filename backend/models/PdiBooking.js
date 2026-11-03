const mongoose = require('mongoose');

const pdiBookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', default: null },
    pdiType: { type: String, enum: ['NEW_CAR', 'USED_CAR'], required: true, index: true },
    name: { type: String, default: '' },
    phone: { type: String, default: '', index: true },
    email: { type: String, default: '' },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    vinOrReg: { type: String, default: '' },
    vehicleSegment: { type: String, enum: ['HATCH_SEDAN', 'SUV_LUXURY', ''], default: '' },
    engineBand: { type: String, enum: ['UPTO_1249', 'ABOVE_1249', 'ELECTRIC', ''], default: '' },
    obdScan: { type: Boolean, default: false },
    serviceHistory: { type: Boolean, default: false },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, default: '' },
    scheduledDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    amount: { type: Number, default: 1299 },
    status: {
      type: String,
      enum: ['REQUESTED', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'REQUESTED',
      index: true,
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
  },
  { timestamps: true, collection: 'pdi_bookings' }
);

module.exports = mongoose.model('PdiBooking', pdiBookingSchema);
