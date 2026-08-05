const mongoose = require('mongoose');

// "Report Ad" — lets a buyer flag a listing (wrong price, sold already,
// suspicious seller, etc). Reviewed by admin, not auto-actioned.
const reportSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null if reported anonymously
    reason: {
      type: String,
      enum: ['Incorrect price', 'Car already sold', 'Suspicious seller', 'Duplicate listing', 'Wrong details', 'Other'],
      required: true,
    },
    message: { type: String, default: '' },
    status: { type: String, enum: ['open', 'reviewed'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
