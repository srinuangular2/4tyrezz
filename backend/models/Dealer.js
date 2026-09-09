const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  logo: { type: String },
  phone: { type: String },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Dealer', dealerSchema);