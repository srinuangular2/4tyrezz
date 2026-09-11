const TestDrive = require('../models/TestDrive');
const Car = require('../models/Car');
const Notification = require('../models/Notification');
const { sendWhatsAppTemplate } = require('../services/integrations/msg91Service');
const { dispatchSafe, EVENTS } = require('../services/notifyService');

exports.create = async (req, res) => {
  const {
    vehicleId,
    customerName,
    customerPhone,
    customerEmail,
    preferredDate,
    preferredTime,
    location,
    homeTestDrive,
    notes,
    dlNumber,
    address,
  } = req.body;

  if (!vehicleId || !customerName || !customerPhone || !preferredDate) {
    return res.status(400).json({ message: 'vehicleId, customerName, customerPhone, preferredDate required' });
  }

  const car = await Car.findById(vehicleId);
  if (!car || (car.unpublished === true) || !['approved', 'PUBLISHED', 'pending'].includes(car.status)) {
    return res.status(404).json({ message: 'Vehicle not available' });
  }

  const doc = await TestDrive.create({
    user: req.user?._id,
    vehicle: car._id,
    dealer: car.owner,
    customerName,
    customerPhone,
    customerEmail: customerEmail || '',
    preferredDate,
    preferredTime,
    location: location || address || '',
    homeTestDrive: !!homeTestDrive,
    notes,
    dlNumber: dlNumber || '',
  });

  await dispatchSafe({
    event: EVENTS.NEW_TEST_DRIVE,
    title: 'New Test Drive',
    message: `${customerName} requested Test Drive for ${car.title}`,
    dealerId: car.owner,
    entityId: doc._id,
    meta: { testDriveId: doc._id, carId: car._id, phone: customerPhone },
  });

  sendWhatsAppTemplate({
    mobile: customerPhone,
    templateName: 'test_drive_request',
    bodyValues: [customerName, car.title, String(preferredDate)],
  }).catch(() => {});

  res.status(201).json({ data: doc });
};

exports.listMine = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};

  if (req.user.role === 'customer') filter.user = req.user._id;
  else if (req.user.role === 'dealer') filter.dealer = req.user._id;
  else if (req.query.dealer) filter.dealer = req.query.dealer;
  if (req.query.status) filter.status = req.query.status;

  const [total, data] = await Promise.all([
    TestDrive.countDocuments(filter),
    TestDrive.find(filter)
      .populate('vehicle', 'title images price year')
      .populate('user', 'name mobile')
      .populate('dealer', 'name dealershipName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
};

const TEST_DRIVE_STATUSES = [
  'Requested',
  'Confirmed',
  'Rescheduled',
  'Scheduled',
  'In Progress',
  'Completed',
  'Feedback Recorded',
  'No-Show',
  'Cancelled',
];

exports.updateStatus = async (req, res) => {
  const { status, dealerNotes, preferredDate, preferredTime } = req.body;
  const doc = await TestDrive.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const isDealer = String(doc.dealer) === String(req.user._id);
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  if (!isDealer && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

  if (status) {
    if (!TEST_DRIVE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid test drive status', allowed: TEST_DRIVE_STATUSES });
    }
    doc.status = status;
  }
  if (dealerNotes != null) doc.dealerNotes = dealerNotes;
  if (preferredDate) doc.preferredDate = preferredDate;
  if (preferredTime) doc.preferredTime = preferredTime;
  if (status === 'Rescheduled') doc.status = 'Rescheduled';
  await doc.save();

  if (doc.user) {
    await Notification.create({
      user: doc.user,
      title: 'Test drive updated',
      body: `Status: ${doc.status}`,
      type: 'test_drive',
    });
  }

  res.json({ data: doc });
};
