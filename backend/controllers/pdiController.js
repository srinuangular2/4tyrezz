const PdiBooking = require('../models/PdiBooking');
const PdiReport = require('../models/PdiReport');
const Payment = require('../models/Payment');
const paymentService = require('../services/integrations/paymentService');
const { TIME_SLOTS, blankChecklist, scoreChecklist, REPAINT_PANELS } = require('../utils/pdiChecklist');
const pricing = require('../utils/pdiPricing');

function quote(input) {
  if (input.vehicleSegment) return pricing.quoteSegment(input).total;
  return pricing.quoteLegacy(input);
}

function isStaff(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

function owns(booking, user) {
  return String(booking.user?._id || booking.user) === String(user._id);
}

function canRead(booking, user) {
  return isStaff(user) || owns(booking, user);
}

exports.meta = (_req, res) => {
  res.json({
    slots: TIME_SLOTS,
    panels: REPAINT_PANELS,
    checklist: blankChecklist(),
    pricing: {
      segments: pricing.SEGMENT_PRICE,
      visitFee: pricing.VISIT_FEE,
      primaryCities: pricing.PRIMARY_CITIES,
      legacy: { base: pricing.LEGACY_BASE, obd: pricing.OBD_FEE, serviceHistory: pricing.HISTORY_FEE },
    },
  });
};

exports.create = async (req, res) => {
  const pdiType = req.body.pdiType === 'NEW_CAR' ? 'NEW_CAR' : req.body.pdiType === 'USED_CAR' ? 'USED_CAR' : '';
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').replace(/\D/g, '').slice(-10);
  const email = String(req.body.email || '').trim().toLowerCase();
  const brand = String(req.body.brand || '').trim();
  const model = String(req.body.model || '').trim();
  const vinOrReg = String(req.body.vinOrReg || '').trim().toUpperCase();
  const address = String(req.body.address || '').trim();
  const city = String(req.body.city || '').trim();
  const pincode = String(req.body.pincode || '').replace(/\D/g, '');
  const timeSlot = String(req.body.timeSlot || '');
  const scheduledDate = req.body.scheduledDate ? new Date(req.body.scheduledDate) : null;
  const vehicleSegment = ['HATCH_SEDAN', 'SUV_LUXURY'].includes(req.body.vehicleSegment) ? req.body.vehicleSegment : '';
  let engineBand = ['UPTO_1249', 'ABOVE_1249', 'ELECTRIC'].includes(req.body.engineBand) ? req.body.engineBand : '';
  if (vehicleSegment && !engineBand) engineBand = vehicleSegment === 'SUV_LUXURY' ? 'ABOVE_1249' : 'UPTO_1249';
  const obdScan = vehicleSegment ? true : (req.body.obdScan === true || req.body.obdScan === 'true');
  const serviceHistory = pdiType === 'USED_CAR' && (vehicleSegment ? true : (req.body.serviceHistory === true || req.body.serviceHistory === 'true'));

  if (!pdiType || !name || phone.length !== 10 || !email.includes('@') || !brand || !model || !address || !city || !engineBand) {
    return res.status(400).json({ message: 'Name, phone, email, car, city, address and car type are required' });
  }
  if (engineBand === 'ELECTRIC' && pdiType !== 'NEW_CAR') {
    return res.status(400).json({ message: 'Electric inspection is available for new cars' });
  }
  if (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || !TIME_SLOTS.includes(timeSlot)) {
    return res.status(400).json({ message: 'Choose a valid date and time slot' });
  }
  if (!req.user?._id) {
    return res.status(401).json({ message: 'Sign in to book an inspection' });
  }

  const amount = quote({ pdiType, engineBand, obdScan, serviceHistory, vehicleSegment, city });
  const booking = await PdiBooking.create({
    user: req.user._id,
    car: /^[a-fA-F0-9]{24}$/.test(String(req.body.carId || '')) ? req.body.carId : null,
    pdiType,
    name,
    phone,
    email,
    brand,
    model,
    vinOrReg,
    vehicleSegment,
    engineBand,
    obdScan,
    serviceHistory,
    address,
    city,
    pincode,
    scheduledDate,
    timeSlot,
    amount,
    status: 'PAYMENT_PENDING',
  });

  let order;
  try {
    order = await paymentService.createOrder({
      amount,
      receipt: `pdi_${String(booking._id).slice(-10)}`,
      notes: { pdiBookingId: String(booking._id), pdiType, brand, model },
    });
  } catch (err) {
    return res.status(201).json({
      data: booking,
      payment: null,
      message: err.message || 'Inspection saved. Payment could not be started.',
    });
  }

  booking.razorpayOrderId = order.id;
  await booking.save();
  await Payment.create({
    user: req.user._id,
    amount,
    status: 'pending',
    method: 'razorpay',
    provider: 'razorpay',
    providerOrderId: order.id,
    meta: {
      kind: 'pdi',
      pdiBooking: booking._id,
      pdiType,
      name,
      phone,
      email,
      brand,
      model,
      vehicleSegment,
      city,
      address,
      scheduledDate,
      timeSlot,
    },
  });

  res.status(201).json({
    data: booking,
    payment: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId: order.keyId,
      stub: !!order.stub,
    },
  });
};

exports.confirm = async (req, res) => {
  const booking = await PdiBooking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!owns(booking, req.user) && !isStaff(req.user)) {
    return res.status(403).json({ message: 'You can only confirm your own PDI booking' });
  }
  if (booking.status === 'CANCELLED') {
    return res.status(400).json({ message: 'This booking is cancelled' });
  }

  const check = paymentService.verifyPaymentSignature({
    orderId: req.body.razorpay_order_id || booking.razorpayOrderId,
    paymentId: req.body.razorpay_payment_id || `pay_stub_${Date.now()}`,
    signature: req.body.razorpay_signature || 'stub',
  });
  if (!check.valid) return res.status(400).json({ message: 'Payment could not be confirmed' });

  booking.status = 'CONFIRMED';
  booking.razorpayPaymentId = req.body.razorpay_payment_id || booking.razorpayPaymentId || `pay_stub_${Date.now()}`;
  await booking.save();
  await Payment.findOneAndUpdate(
    { providerOrderId: booking.razorpayOrderId },
    {
      status: 'paid',
      providerPaymentId: booking.razorpayPaymentId,
      invoiceRef: `PDI-${String(booking._id).slice(-8).toUpperCase()}`,
    }
  );
  res.json({ data: booking });
};

exports.list = async (req, res) => {
  const filter = isStaff(req.user) ? {} : { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const data = await PdiBooking.find(filter).sort('-createdAt').limit(200).populate('user', 'name mobile').lean();
  const reports = await PdiReport.find({ booking: { $in: data.map((row) => row._id) } }).select('booking score').lean();
  const scoreByBooking = Object.fromEntries(reports.map((row) => [String(row.booking), row.score]));
  res.json({
    data: data.map((row) => ({ ...row, score: scoreByBooking[String(row._id)] ?? null })),
  });
};

exports.getOne = async (req, res) => {
  const booking = await PdiBooking.findById(req.params.id).populate('user', 'name mobile');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!canRead(booking, req.user)) return res.status(403).json({ message: 'Not allowed to view this booking' });
  const report = await PdiReport.findOne({ booking: booking._id }).lean();
  res.json({ data: booking, report });
};

exports.updateStatus = async (req, res) => {
  const status = String(req.body.status || '');
  const allowed = ['PAYMENT_PENDING', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const booking = await PdiBooking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (status === 'COMPLETED') {
    const report = await PdiReport.findOne({ booking: booking._id });
    if (!report) return res.status(400).json({ message: 'Submit the inspection report before marking complete' });
  }
  booking.status = status;
  await booking.save();
  res.json({ data: booking });
};

exports.submitReport = async (req, res) => {
  const booking = await PdiBooking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'PAYMENT_PENDING' || booking.status === 'CANCELLED') {
    return res.status(400).json({ message: 'Booking is not ready for inspection' });
  }

  let incoming = req.body.categories;
  if (typeof incoming === 'string') {
    try { incoming = JSON.parse(incoming); } catch { incoming = null; }
  }
  const base = blankChecklist();
  const categories = base.map((cat) => {
    const match = Array.isArray(incoming) ? incoming.find((row) => row.key === cat.key) : null;
    return {
      ...cat,
      items: cat.items.map((item) => {
        const found = match?.items?.find((row) => row.key === item.key);
        return { ...item, result: found?.result === 'fail' ? 'fail' : 'pass' };
      }),
    };
  });
  const scored = scoreChecklist(categories);

  let panels = req.body.repaintedPanels || [];
  if (typeof panels === 'string') {
    try { panels = JSON.parse(panels); } catch { panels = panels.split(',').map((v) => v.trim()).filter(Boolean); }
  }
  panels = (Array.isArray(panels) ? panels : []).filter((name) => REPAINT_PANELS.includes(name));

  const uploaded = (req.files || []).map((file) => `/uploads/pdi/${file.filename}`);
  const existing = await PdiReport.findOne({ booking: booking._id });
  const photos = [...(existing?.photos || []), ...uploaded].slice(0, 12);

  const report = await PdiReport.findOneAndUpdate(
    { booking: booking._id },
    {
      booking: booking._id,
      user: booking.user,
      inspector: req.user._id,
      score: scored.score,
      categories: scored.categories,
      repaintedPanels: panels,
      photos,
      notes: String(req.body.notes || '').slice(0, 2000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (booking.status === 'CONFIRMED') booking.status = 'IN_PROGRESS';
  await booking.save();
  res.json({ data: report });
};
