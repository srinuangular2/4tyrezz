const mongoose = require('mongoose');

const vehicleVariantSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'CarModel', required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    fuel: { type: String, default: '' },
    transmission: { type: String, default: '' },
    bodyType: { type: String, default: '' },
    engineCc: { type: Number },
    source: { type: String, default: '' },
    sourceKey: { type: String, required: true },
  },
  { timestamps: true }
);

vehicleVariantSchema.index({ sourceKey: 1 }, { unique: true });
vehicleVariantSchema.index({ brand: 1, model: 1, slug: 1 });

module.exports = mongoose.model('VehicleVariant', vehicleVariantSchema);
