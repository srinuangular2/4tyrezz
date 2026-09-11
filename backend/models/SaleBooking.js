const Booking = require('./Booking');

const SALE_STATUSES = [
  'Requested',
  'Confirmed',
  'Payment Pending',
  'Booked',
  'Token Received',
  'Financing Pending',
  'Fully Paid',
  'Cancelled',
  'Cancelled/Refunded',
  'Completed',
  'Refunded',
];

module.exports = Booking;
module.exports.SALE_STATUSES = SALE_STATUSES;
