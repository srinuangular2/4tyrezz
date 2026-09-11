const mongoose = require('mongoose');

const valuationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    brand: { type: String, default: '' },
    model: { type: String, default: '' },
    variant: { type: String, default: '' },
    year: { type: Number, required: true },
    kmDriven: { type: Number, required: true },
    ownership: { type: Number, default: 1 },
    conditionScore: { type: Number, default: 7 },
    fuel: { type: String, default: '' },
    transmission: { type: String, default: '' },
    city: { type: String, default: '' },
    expectedPrice: { type: Number, default: null },
    estimate: { type: Number, required: true },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    source: { type: String, default: 'valuationEngine' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Valuation', valuationSchema);
