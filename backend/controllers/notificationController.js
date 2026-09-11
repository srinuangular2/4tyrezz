const Notification = require('../models/Notification');
const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const DealerProfile = require('../models/DealerProfile');
const { serializeDoc } = require('../services/notifyService');

const LEAD_TYPES = ['LEAD', 'lead', 'enquiry', 'finance', 'insurance'];
const TEST_DRIVE_TYPES = ['TEST_DRIVE', 'test_drive'];
const BOOKING_TYPES = ['BOOKING', 'booking'];

function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

function isDealer(user) {
  return user?.role === 'dealer';
}

exports.listMine = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 30);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;

  const [total, data, unread] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({
    data: data.map(serializeDoc),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    unread,
  });
};

exports.unreadCounts = async (req, res) => {
  const uid = req.user._id;
  const admin = isAdmin(req.user);
  const dealer = isDealer(req.user);

  const leadScope = dealer ? { seller: uid } : {};
  const tdScope = dealer ? { dealer: uid } : {};
  const bkScope = dealer ? { dealer: uid } : {};

  const unreadFilter = (types, events) => ({
    user: uid,
    read: false,
    $or: [{ type: { $in: types } }, { event: { $in: events } }],
  });

  const [
    unread,
    unreadLeads,
    unreadTestDrives,
    unreadBookings,
    unreadKyc,
    unreadModeration,
    leads,
    testDrives,
    bookings,
    kycPending,
    moderation,
  ] = await Promise.all([
    Notification.countDocuments({ user: uid, read: false }),
    Notification.countDocuments(unreadFilter(LEAD_TYPES, ['NEW_LEAD', 'NEW_FINANCE', 'NEW_INSURANCE'])),
    Notification.countDocuments(unreadFilter(TEST_DRIVE_TYPES, ['NEW_TEST_DRIVE'])),
    Notification.countDocuments(unreadFilter(BOOKING_TYPES, ['NEW_BOOKING'])),
    admin
      ? Notification.countDocuments({
          user: uid,
          read: false,
          $or: [{ type: 'KYC' }, { event: 'NEW_DEALER_KYC' }],
        })
      : Promise.resolve(0),
    admin
      ? Notification.countDocuments({
          user: uid,
          read: false,
          $or: [{ type: 'MODERATION' }, { event: 'NEW_LISTING_MODERATION' }],
        })
      : Promise.resolve(0),
    Lead.countDocuments({
      ...leadScope,
      $or: [{ stage: 'New Lead' }, { status: 'New Lead' }, { status: 'New' }],
    }),
    TestDrive.countDocuments({ ...tdScope, status: 'Requested' }),
    Booking.countDocuments({
      ...bkScope,
      status: { $in: ['Payment Pending', 'Requested', 'Booked', 'Token Received'] },
    }),
    admin
      ? DealerProfile.countDocuments({
          kycStatus: {
            $in: ['PENDING_ADMIN_APPROVAL', 'PENDING_KYC_APPROVAL', 'submitted', 'under_review'],
          },
        })
      : Promise.resolve(0),
    admin
      ? Car.countDocuments({ $or: [{ listingStatus: 'PENDING_MODERATION' }, { status: 'pending' }] })
      : Promise.resolve(0),
  ]);

  res.json({
    unread,
    leads,
    testDrives,
    bookings,
    kycPending,
    moderation,
    unreadByType: {
      leads: unreadLeads,
      testDrives: unreadTestDrives,
      bookings: unreadBookings,
      kycPending: unreadKyc,
      moderation: unreadModeration,
    },
  });
};

exports.markRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, _id: req.params.id === 'all' ? { $exists: true } : req.params.id },
    { read: true }
  );
  res.json({ success: true });
};

exports.markReadBulk = async (req, res) => {
  const { id, ids, all } = req.body || {};
  const filter = { user: req.user._id, read: false };
  if (all === true || id === 'all') {
    /* all unread for this user */
  } else if (Array.isArray(ids) && ids.length) {
    filter._id = { $in: ids };
  } else if (id) {
    filter._id = id;
  } else {
    return res.status(400).json({ message: 'Provide id, ids, or all: true' });
  }
  const result = await Notification.updateMany(filter, { read: true });
  res.json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
};
