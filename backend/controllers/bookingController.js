const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Car = require('../models/Car');
const paymentService = require('../services/integrations/paymentService');
const { dispatchSafe, EVENTS } = require('../services/notifyService');

const BOOKING_TOKEN_DEFAULT = Number(process.env.BOOKING_TOKEN_AMOUNT || 5000);
const COMMISSION_RATE = Number(process.env.COMMISSION_RATE_PERCENT || 2.5);

exports.create = async (req, res) => {
  const { vehicleId, notes } = req.body;
  const car = await Car.findById(vehicleId);
  if (!car || !['approved', 'pending'].includes(car.status)) {
    return res.status(404).json({ message: 'Vehicle not available for booking' });
  }
  if (car.status === 'sold') {
    return res.status(400).json({ message: 'Vehicle already sold' });
  }

  const requested = Number(req.body.amount || req.body.tokenAmount);
  const amount = [5000, 10000].includes(requested) ? requested : BOOKING_TOKEN_DEFAULT;
  const booking = await Booking.create({
    user: req.user._id,
    vehicle: car._id,
    dealer: car.owner,
    amount,
    status: 'Payment Pending',
    notes: notes || '',
  });

  const order = await paymentService.createOrder({
    amount,
    receipt: booking.bookingRef,
    notes: { bookingId: String(booking._id), vehicleId: String(car._id) },
  });

  booking.razorpayOrderId = order.id;
  await booking.save();

  await Payment.create({
    booking: booking._id,
    user: req.user._id,
    dealer: car.owner,
    vehicle: car._id,
    amount,
    status: 'pending',
    providerOrderId: order.id,
    method: 'razorpay',
  });

  res.status(201).json({
    data: (() => {
      const obj = booking.toObject ? booking.toObject() : { ...booking };
      delete obj.dealer;
      return obj;
    })(),
    payment: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId: order.keyId,
      stub: !!order.stub,
    },
  });
};

exports.verifyPayment = async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const check = paymentService.verifyPaymentSignature({
    orderId: razorpay_order_id || booking.razorpayOrderId,
    paymentId: razorpay_payment_id || `pay_stub_${Date.now()}`,
    signature: razorpay_signature || 'stub',
  });

  if (!check.valid) return res.status(400).json({ message: 'Invalid payment signature' });

  booking.status = 'Booked';
  booking.razorpayPaymentId = razorpay_payment_id || booking.razorpayPaymentId;
  booking.paymentId = booking.razorpayPaymentId;
  await booking.save();

  await Payment.findOneAndUpdate(
    { booking: booking._id },
    {
      status: 'paid',
      providerPaymentId: booking.razorpayPaymentId,
      invoiceRef: `INV-${booking.bookingRef}`,
    }
  );

  const bookedCar = await Car.findById(booking.vehicle).select('title');
  await dispatchSafe({
    event: EVENTS.NEW_BOOKING,
    title: 'New Booking',
    message: `Token booking ${booking.bookingRef} confirmed${bookedCar?.title ? ` for ${bookedCar.title}` : ''}`,
    entityId: booking._id,
    meta: { bookingId: booking._id, bookingRef: booking.bookingRef, carId: booking.vehicle, inventoryOwner: booking.dealer },
    adminOnly: true,
  });

  res.json({ data: booking, verified: true, stub: !!check.stub });
};

exports.list = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  if (req.user.role === 'dealer') {
    return res.json({ data: [], page, limit, total: 0, totalPages: 1 });
  }
  const filter = {};
  if (req.user.role === 'customer') filter.user = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const query = Booking.find(filter)
    .populate('vehicle', 'title images price year')
    .populate('user', 'name mobile email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    query.populate('dealer', 'name dealershipName');
  }

  const [total, data] = await Promise.all([
    Booking.countDocuments(filter),
    query,
  ]);
  const rows = (req.user.role === 'admin' || req.user.role === 'super_admin')
    ? data
    : data.map((row) => {
      const obj = row.toObject ? row.toObject() : { ...row };
      delete obj.dealer;
      return obj;
    });

  res.json({ data: rows, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
};

const BOOKING_STATUSES = [
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

exports.updateStatus = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Not found' });

  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  if (!isAdmin) return res.status(403).json({ message: 'Bookings are handled by 4tyrezz admin' });

  const { status } = req.body;
  if (!status || !BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid booking status', allowed: BOOKING_STATUSES });
  }
  booking.status = status;
  await booking.save();

  if (status === 'Completed') {
    const car = await Car.findById(booking.vehicle);
    if (car) {
      car.status = 'sold';
      await car.save();
      const amount = Math.round((car.price * COMMISSION_RATE) / 100);
      await Commission.findOneAndUpdate(
        { vehicle: car._id, booking: booking._id },
        {
          vehicle: car._id,
          dealer: car.owner,
          booking: booking._id,
          salePrice: car.price,
          ratePercent: COMMISSION_RATE,
          amount,
          status: 'pending',
        },
        { upsert: true, new: true }
      );
    }
  }

  if (status === 'Refunded' || status === 'Cancelled/Refunded' || status === 'Cancelled') {
    await Payment.findOneAndUpdate({ booking: booking._id }, { status: 'refunded' });
  }

  res.json({ data: booking });
};

exports.listPayments = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.user.role === 'customer') filter.user = req.user._id;
  else if (req.user.role === 'dealer') filter.dealer = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const [total, data] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter)
      .populate('vehicle', 'title')
      .populate('user', 'name mobile')
      .populate('booking', 'bookingRef status')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
};

exports.listCommissions = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.user.role === 'dealer') {
    return res.json({ data: [], page, limit, total: 0, totalPages: 1 });
  }
  if (req.query.status) filter.status = req.query.status;

  const [total, data] = await Promise.all([
    Commission.countDocuments(filter),
    Commission.find(filter)
      .populate('vehicle', 'title price')
      .populate('dealer', 'name dealershipName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
};

exports.updateCommission = async (req, res) => {
  const doc = await Commission.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, notes: req.body.notes },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ data: doc });
};

exports.settleCommission = async (req, res) => {
  const CommissionLedger = require('../models/CommissionLedger');
  const doc = await Commission.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  doc.status = 'paid';
  doc.settledAt = new Date();
  doc.settledBy = req.user._id;
  doc.payoutRef = req.body.payoutRef || `PAYOUT-${Date.now().toString(36).toUpperCase()}`;
  doc.notes = req.body.notes || doc.notes;
  await doc.save();
  const ledger = await CommissionLedger.create({
    dealer: doc.dealer,
    commissions: [doc._id],
    amount: doc.amount,
    status: 'settled',
    notes: doc.notes,
    processedBy: req.user._id,
    payoutRef: doc.payoutRef,
  });
  res.json({ data: doc, ledger });
};

exports.settleDealerCommissions = async (req, res) => {
  const CommissionLedger = require('../models/CommissionLedger');
  const dealerId = req.body.dealerId || req.params.dealerId;
  if (!dealerId) return res.status(400).json({ message: 'dealerId required' });
  const rows = await Commission.find({ dealer: dealerId, status: { $in: ['pending', 'approved'] } });
  if (!rows.length) return res.status(400).json({ message: 'No pending commissions for this dealer' });
  const amount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const payoutRef = req.body.payoutRef || `PAYOUT-${Date.now().toString(36).toUpperCase()}`;
  await Commission.updateMany(
    { _id: { $in: rows.map((r) => r._id) } },
    { status: 'paid', settledAt: new Date(), settledBy: req.user._id, payoutRef }
  );
  const ledger = await CommissionLedger.create({
    dealer: dealerId,
    commissions: rows.map((r) => r._id),
    amount,
    status: 'settled',
    notes: req.body.notes || '',
    processedBy: req.user._id,
    payoutRef,
  });
  res.json({ data: ledger, settled: rows.length, amount });
};

exports.listLedger = async (req, res) => {
  const CommissionLedger = require('../models/CommissionLedger');
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const [total, data] = await Promise.all([
    CommissionLedger.countDocuments(),
    CommissionLedger.find()
      .populate('dealer', 'name dealershipName')
      .populate('processedBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
};
