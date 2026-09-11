const Car = require('./Car');

const LISTING_STATUSES = ['DRAFT', 'PENDING_MODERATION', 'PUBLISHED', 'REJECTED', 'SOLD', 'UNPUBLISHED'];
const AVAILABILITY = ['available', 'reserved', 'in_transit', 'unavailable'];

module.exports = Car;
module.exports.LISTING_STATUSES = LISTING_STATUSES;
module.exports.AVAILABILITY = AVAILABILITY;
