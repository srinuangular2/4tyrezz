const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, index: true },
    model: { type: String, required: true, index: true },
    bodyType: { type: String, default: '', index: true },
    fuelType: { type: String, default: '', index: true },
    transmission: { type: String, default: '', index: true },
    variant: { type: String, default: '', index: true },
    engineCc: { type: Number },
    msrp: { type: Number },
    years: { type: [Number], default: [] },
    source: { type: String, default: '' },
    sourceKey: { type: String, required: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ brand: 1, model: 1 });
vehicleSchema.index({ brand: 1, model: 1, fuelType: 1, transmission: 1 });
vehicleSchema.index({ sourceKey: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
