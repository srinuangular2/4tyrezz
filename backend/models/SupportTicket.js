const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    category: {
      type: String,
      enum: ['general', 'listing', 'payment', 'kyc', 'technical', 'complaint'],
      default: 'general',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String, default: '' },
    replies: [
      {
        author: { type: String, default: '' },
        role: { type: String, default: 'customer' },
        body: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
