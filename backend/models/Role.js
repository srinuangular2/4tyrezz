const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
