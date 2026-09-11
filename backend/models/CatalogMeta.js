const mongoose = require('mongoose');

const catalogMetaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    source: { type: String, default: '' },
    dataAsOf: { type: String, default: '' },
    brandCount: { type: Number, default: 0 },
    modelCount: { type: Number, default: 0 },
    variantCount: { type: Number, default: 0 },
    ingestedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CatalogMeta', catalogMetaSchema);
