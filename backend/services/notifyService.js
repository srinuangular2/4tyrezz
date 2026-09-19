const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToRooms, adminRoom, dealerRoom, userRoom } = require('./socketService');

const EVENTS = {
  NEW_LEAD: 'NEW_LEAD',
  NEW_FINANCE: 'NEW_FINANCE',
  NEW_INSURANCE: 'NEW_INSURANCE',
  NEW_TEST_DRIVE: 'NEW_TEST_DRIVE',
  NEW_BOOKING: 'NEW_BOOKING',
  NEW_DEALER_KYC: 'NEW_DEALER_KYC',
  NEW_LISTING_MODERATION: 'NEW_LISTING_MODERATION',
};

const EVENT_TYPE = {
  NEW_LEAD: 'LEAD',
  NEW_FINANCE: 'finance',
  NEW_INSURANCE: 'insurance',
  NEW_TEST_DRIVE: 'TEST_DRIVE',
  NEW_BOOKING: 'BOOKING',
  NEW_DEALER_KYC: 'KYC',
  NEW_LISTING_MODERATION: 'MODERATION',
};

const SOUND_KEYS = {
  NEW_LEAD: 'lead',
  NEW_FINANCE: 'finance',
  NEW_INSURANCE: 'insurance',
  NEW_TEST_DRIVE: 'testdrive',
  NEW_BOOKING: 'booking',
  NEW_DEALER_KYC: 'kyc',
  NEW_LISTING_MODERATION: 'moderation',
};

const ADMIN_ONLY = new Set([
  EVENTS.NEW_DEALER_KYC,
  EVENTS.NEW_LISTING_MODERATION,
  EVENTS.NEW_LEAD,
  EVENTS.NEW_FINANCE,
  EVENTS.NEW_INSURANCE,
  EVENTS.NEW_TEST_DRIVE,
  EVENTS.NEW_BOOKING,
]);

const DEFAULT_LINKS = {
  NEW_LEAD: { admin: '/leads', dealer: '/dealer/dashboard/leads' },
  NEW_FINANCE: { admin: '/finance', dealer: '/dealer/dashboard/leads' },
  NEW_INSURANCE: { admin: '/insurance', dealer: '/dealer/dashboard/leads' },
  NEW_TEST_DRIVE: { admin: '/test-drives', dealer: '/dealer/dashboard/test-drives' },
  NEW_BOOKING: { admin: '/bookings', dealer: '/dealer/dashboard/bookings' },
  NEW_DEALER_KYC: { admin: '/dealers', dealer: '/dealer/onboarding' },
  NEW_LISTING_MODERATION: { admin: '/listings/moderation', dealer: '/dealer/dashboard/inventory' },
};

function soundKeyFor({ event, type, meta = {} } = {}) {
  const enquiry = String(meta.enquiryType || meta.soundKey || '').toLowerCase();
  const t = String(type || '').toLowerCase();
  if (event === EVENTS.NEW_INSURANCE || enquiry === 'insurance' || t === 'insurance') return 'insurance';
  if (event === EVENTS.NEW_FINANCE || enquiry === 'finance' || t === 'finance') return 'finance';
  if (event === EVENTS.NEW_TEST_DRIVE || t === 'test_drive' || t === 'testdrive') return 'testdrive';
  if (event === EVENTS.NEW_BOOKING || t === 'booking') return 'booking';
  if (event === EVENTS.NEW_DEALER_KYC || t === 'kyc') return 'kyc';
  if (event === EVENTS.NEW_LISTING_MODERATION || t === 'moderation') return 'moderation';
  return SOUND_KEYS[event] || 'lead';
}

function serializeDoc(doc) {
  const o = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  return {
    ...o,
    recipientId: o.user,
    message: o.body,
    isRead: !!o.read,
  };
}

async function adminRecipients() {
  return User.find({
    role: { $in: ['admin', 'super_admin'] },
    isActive: { $ne: false },
  }).select('_id role');
}

function withId(link, entityId) {
  if (!link) return '';
  if (!entityId) return link;
  return link.includes('?') ? `${link}&id=${entityId}` : `${link}?id=${entityId}`;
}

/**
 * Persist Notification rows and emit Socket.io events to admin-room and/or dealer-{id}.
 */
async function dispatch({
  event,
  title,
  message,
  body,
  type,
  link,
  adminLink,
  dealerLink,
  dealerId,
  extraUserIds = [],
  entityId,
  meta = {},
  adminOnly,
} = {}) {
  if (!event || !EVENTS[event]) {
    throw new Error('Unknown notification event');
  }
  const text = String(message || body || title || 'New alert');
  const heading = String(title || 'New alert');
  const mappedType = type || EVENT_TYPE[event];
  const soundKey = soundKeyFor({ event, type: mappedType, meta });
  const onlyAdmins = adminOnly != null ? adminOnly : ADMIN_ONLY.has(event);
  const links = DEFAULT_LINKS[event] || { admin: '/', dealer: '/' };
  const aLink = withId(adminLink || link || links.admin, entityId);
  const dLink = withId(dealerLink || links.dealer, entityId);

  const rows = [];
  const admins = await adminRecipients();
  admins.forEach((admin) => {
    rows.push({
      user: admin._id,
      recipientRole: 'admin',
      title: heading,
      body: text,
      type: mappedType,
      event,
      link: aLink,
      read: false,
      meta: { ...meta, event, soundKey, entityId, dealerId: dealerId ? String(dealerId) : undefined },
    });
  });

  const dealerKey = dealerId ? String(dealerId) : '';
  if (dealerKey && !onlyAdmins) {
    const already = rows.some((r) => String(r.user) === dealerKey);
    if (!already) {
      rows.push({
        user: dealerKey,
        recipientRole: 'dealer',
        title: heading,
        body: text,
        type: mappedType,
        event,
        link: dLink,
        read: false,
        meta: { ...meta, event, soundKey, entityId, dealerId: dealerKey },
      });
    }
  }

  (extraUserIds || []).forEach((id) => {
    const uid = String(id);
    if (!uid || rows.some((r) => String(r.user) === uid)) return;
    rows.push({
      user: uid,
      recipientRole: 'customer',
      title: heading,
      body: text,
      type: mappedType,
      event,
      link: dLink || aLink,
      read: false,
      meta: { ...meta, event, soundKey, entityId },
    });
  });

  let created = [];
  if (rows.length) {
    created = await Notification.insertMany(rows);
  }

  const payload = {
    event,
    type: mappedType,
    soundKey,
    title: heading,
    message: text,
    body: text,
    link: aLink,
    dealerLink: dLink,
    entityId: entityId ? String(entityId) : undefined,
    dealerId: dealerKey || undefined,
    createdAt: new Date().toISOString(),
    meta: { ...meta, event, soundKey, enquiryType: meta.enquiryType || undefined },
  };

  const rooms = [adminRoom()];
  if (dealerKey && !onlyAdmins) rooms.push(dealerRoom(dealerKey));
  emitToRooms(rooms, event, payload);
  emitToRooms(rooms, 'notification', payload);
  created.forEach((doc) => {
    emitToRooms([userRoom(doc.user)], 'notification', {
      ...payload,
      notification: serializeDoc(doc),
      link: doc.link,
    });
  });

  return created;
}

function dispatchSafe(opts) {
  return dispatch(opts).catch((err) => {
    console.warn('[notify]', err.message);
    return [];
  });
}

module.exports = {
  EVENTS,
  EVENT_TYPE,
  SOUND_KEYS,
  soundKeyFor,
  dispatch,
  dispatchSafe,
  serializeDoc,
};
