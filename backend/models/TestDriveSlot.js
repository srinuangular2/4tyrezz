const mongoose = require('mongoose');

const testDriveSlotSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testDrive: { type: mongoose.Schema.Types.ObjectId, ref: 'TestDrive', index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    slotDate: { type: Date, required: true, index: true },
    slotTime: { type: String, default: '' },
    homeTestDrive: { type: Boolean, default: false },
    dlNumber: { type: String, default: '' },
    checklistComplete: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Feedback Recorded', 'No-Show'],
      default: 'Scheduled',
      index: true,
    },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestDriveSlot', testDriveSlotSchema);
