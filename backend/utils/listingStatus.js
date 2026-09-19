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

async function findPlatformOwnerId() {
  const User = require('../models/User');
  const admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] }, isActive: { $ne: false } })
    .sort({ createdAt: 1 })
    .select('_id');
  return admin?._id || null;
}

async function republishOrphanedApprovedCars() {
  const Car = require('../models/Car');
  const User = require('../models/User');
  const ownerId = await findPlatformOwnerId();
  if (!ownerId) return { updated: 0 };

  const hidden = await Car.find({ status: 'approved', unpublished: true }).select('_id owner').lean();
  if (!hidden.length) return { updated: 0 };

  const ownerIds = [...new Set(hidden.map((c) => String(c.owner || '')).filter(Boolean))];
  const existing = ownerIds.length
    ? await User.find({ _id: { $in: ownerIds } }).select('_id').lean()
    : [];
  const existingSet = new Set(existing.map((u) => String(u._id)));
  const orphanIds = hidden
    .filter((c) => !c.owner || !existingSet.has(String(c.owner)))
    .map((c) => c._id);
  if (!orphanIds.length) return { updated: 0 };

  const result = await Car.updateMany(
    { _id: { $in: orphanIds } },
    { $set: { owner: ownerId, unpublished: false, listingStatus: 'PUBLISHED' } }
  );
  return { updated: result.modifiedCount || result.nModified || 0 };
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
  findPlatformOwnerId,
  republishOrphanedApprovedCars,
};
