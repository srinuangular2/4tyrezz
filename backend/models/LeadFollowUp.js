const mongoose = require('mongoose');

const leadFollowUpSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['call', 'whatsapp', 'note', 'visit'], default: 'note' },
    note: { type: String, default: '' },
    nextFollowUpAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeadFollowUp', leadFollowUpSchema);
