const mongoose = require('mongoose');

const testDriveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, default: '' },
    location: { type: String, default: '' },
    homeTestDrive: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'Requested',
        'Confirmed',
        'Rescheduled',
        'Scheduled',
        'In Progress',
        'Completed',
        'Feedback Recorded',
        'No-Show',
        'Cancelled',
      ],
      default: 'Requested',
      index: true,
    },
    dealerNotes: { type: String, default: '' },
    dlNumber: { type: String, default: '' },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestDrive', testDriveSchema);
