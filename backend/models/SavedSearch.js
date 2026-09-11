const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, default: 'Saved search' },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    alertsEnabled: { type: Boolean, default: false },
    emailAlerts: { type: Boolean, default: false },
    whatsappAlerts: { type: Boolean, default: false },
    newMatchAlerts: { type: Boolean, default: false },
    priceChangeAlerts: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
