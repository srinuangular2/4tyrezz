const mongoose = require('mongoose');

const bulkUploadLogSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, default: '' },
    totalRows: { type: Number, default: 0 },
    imported: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    rowErrors: [{ row: Number, message: String }],
    carIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BulkUploadLog', bulkUploadLogSchema);
