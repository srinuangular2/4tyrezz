const PUBLIC_STATUSES = ['approved', 'PUBLISHED'];
const PENDING_STATUSES = ['pending', 'PENDING_MODERATION', 'draft', 'DRAFT'];

function requiresListingModeration() {
  return String(process.env.REQUIRE_LISTING_MODERATION || 'true').toLowerCase() !== 'false';
}

function publicListingFilter() {
  return {
    unpublished: { $ne: true },
    status: { $in: PUBLIC_STATUSES },
  };
}

function listingFieldsForCreate({ isAdmin = false } = {}) {
  if (isAdmin || !requiresListingModeration()) {
    return { status: 'approved', listingStatus: 'PUBLISHED', unpublished: false };
  }
  return { status: 'pending', listingStatus: 'PENDING_MODERATION', unpublished: false };
}

function syncFromListingStatus(listingStatus, current = {}) {
  const next = { listingStatus };
  switch (listingStatus) {
    case 'PUBLISHED':
      next.status = 'approved';
      next.unpublished = false;
      break;
    case 'PENDING_MODERATION':
      next.status = 'pending';
      next.unpublished = false;
      break;
    case 'REJECTED':
      next.status = 'rejected';
      next.unpublished = true;
      break;
    case 'SOLD':
      next.status = 'sold';
      next.unpublished = true;
      break;
    case 'UNPUBLISHED':
      next.status = current.status === 'sold' ? 'sold' : 'approved';
      next.unpublished = true;
      break;
    case 'DRAFT':
    default:
      next.status = 'pending';
      next.unpublished = true;
      next.listingStatus = listingStatus || 'DRAFT';
      break;
  }
  return next;
}

function displayListingStatus(car = {}) {
  if (car.listingStatus) return car.listingStatus;
  if (car.unpublished && car.status === 'approved') return 'UNPUBLISHED';
  if (car.status === 'approved') return 'PUBLISHED';
  if (car.status === 'sold') return 'SOLD';
  if (car.status === 'rejected') return 'REJECTED';
  if (car.status === 'pending') return 'PENDING_MODERATION';
  return 'DRAFT';
}

function scopedDealerId(req) {
  const q = req.query?.dealerId || req.body?.dealerId;
  if (req.user?.role === 'admin' && q && /^[a-fA-F0-9]{24}$/.test(String(q))) {
    return q;
  }
  return req.user._id;
}

module.exports = {
  PUBLIC_STATUSES,
  PENDING_STATUSES,
  requiresListingModeration,
  publicListingFilter,
  listingFieldsForCreate,
  syncFromListingStatus,
  displayListingStatus,
  scopedDealerId,
};
