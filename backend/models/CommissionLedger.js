const mongoose = require('mongoose');

const commissionLedgerSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    commissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commission' }],
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'settled', 'failed'], default: 'settled', index: true },
    notes: { type: String, default: '' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date, default: Date.now },
    payoutRef: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommissionLedger', commissionLedgerSchema);
