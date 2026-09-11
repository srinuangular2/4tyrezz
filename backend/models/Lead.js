const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    message: { type: String, default: '' },
    enquiryType: {
      type: String,
      enum: ['call', 'whatsapp', 'enquiry', 'test_drive', 'booking', 'finance', 'insurance', 'valuation', 'other'],
      default: 'enquiry',
    },
    source: { type: String, default: 'website' },
    stage: {
      type: String,
      enum: [
        'New Lead',
        'Contacted',
        'Follow-Up Scheduled',
        'Test Drive Booked',
        'Negotiation',
        'Token Booked',
        'Sold',
        'Lost',
      ],
      default: 'New Lead',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'New',
        'New Lead',
        'Contacted',
        'Follow-up',
        'Follow-Up',
        'Follow-Up Scheduled',
        'Test Drive Scheduled',
        'Test Drive Booked',
        'Negotiation',
        'Token Booked',
        'Booked',
        'Sold',
        'Closed/Won',
        'Lost',
        'Closed',
      ],
      default: 'New Lead',
      index: true,
    },
    assignedRep: { type: String, default: '' },
    callOutcome: {
      type: String,
      enum: ['', 'Connected', 'Interested', 'Not Answering', 'Wrong Number'],
      default: '',
    },
    followUpAt: { type: Date, default: null },
    remarks: { type: String, default: '' },
    remarksLog: [
      {
        note: { type: String, default: '' },
        outcome: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    stageHistory: [
      {
        from: { type: String, default: '' },
        to: { type: String, default: '' },
        at: { type: Date, default: Date.now },
      },
    ],
    activity: [
      {
        type: { type: String, default: 'note' },
        note: { type: String, default: '' },
        nextFollowUpAt: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
