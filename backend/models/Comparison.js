const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, default: 'Comparison' },
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comparison', comparisonSchema);
