const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    result: { type: String, enum: ['pass', 'fail'], default: 'pass' },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    status: { type: String, enum: ['pass', 'fail'], default: 'pass' },
    items: { type: [itemSchema], default: [] },
  },
  { _id: false }
);

const pdiReportSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'PdiBooking', required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, min: 0, max: 100, default: 0 },
    categories: { type: [categorySchema], default: [] },
    repaintedPanels: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    notes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'pdi_reports' }
);

module.exports = mongoose.model('PdiReport', pdiReportSchema);
