const mongoose = require('mongoose');

const carModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    bodyType: { type: String, default: '' },
  },
  { timestamps: true }
);

carModelSchema.index({ brand: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('CarModel', carModelSchema);
