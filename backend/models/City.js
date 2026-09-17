const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    state: { type: String, default: '' },
    isPopular: { type: Boolean, default: false },
    areas: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('City', citySchema);