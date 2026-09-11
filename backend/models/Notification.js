const mongoose = require('mongoose');

const TYPE_ENUM = [
  'LEAD',
  'TEST_DRIVE',
  'BOOKING',
  'KYC',
  'MODERATION',
  'lead',
  'enquiry',
  'test_drive',
  'booking',
  'price_drop',
  'match',
  'finance',
  'insurance',
  'approval',
  'system',
];

const EVENT_ENUM = [
  'NEW_LEAD',
  'NEW_FINANCE',
  'NEW_INSURANCE',
  'NEW_TEST_DRIVE',
  'NEW_BOOKING',
  'NEW_DEALER_KYC',
  'NEW_LISTING_MODERATION',
  '',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientRole: {
      type: String,
      enum: ['admin', 'dealer', 'customer', 'super_admin', ''],
      default: '',
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: TYPE_ENUM, default: 'system', index: true },
    event: { type: String, enum: EVENT_ENUM, default: '', index: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.virtual('recipientId').get(function recipientId() {
  return this.user;
});
notificationSchema.virtual('message').get(function message() {
  return this.body;
});
notificationSchema.virtual('isRead').get(function isRead() {
  return this.read;
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
