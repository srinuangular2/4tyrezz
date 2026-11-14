const crypto = require('crypto');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Car = require('../models/Car');
const User = require('../models/User');
const paymentService = require('../services/integrations/paymentService');
const { dispatchSafe, EVENTS } = require('../services/notifyService');

const MAX_OPEN_AMOUNT = 20000000;

function razorpayKeys() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  };
}

function keysConfigured() {
  const { keyId, keySecret } = razorpayKeys();
  return Boolean(keyId && keySecret);
}

function companyAccounts() {
  const raw = process.env.COMPANY_BANK_ACCOUNTS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((row) => row && row.accountNumber)
          .map((row) => ({
            bankName: String(row.bankName || ''),
            accountName: String(row.accountName || '4TYREZZ'),
            accountNumber: String(row.accountNumber),
            ifsc: String(row.ifsc || ''),
            branch: String(row.branch || ''),
            accountType: String(row.accountType || 'Current'),
          }));
      }
    } catch {
      /* fall through to single-account env */
    }
  }
  if (!process.env.COMPANY_ACCOUNT_NUMBER) return [];
  return [{
    bankName: process.env.COMPANY_BANK_NAME || '',
    accountName: process.env.COMPANY_ACCOUNT_NAME || '4TYREZZ',
    accountNumber: process.env.COMPANY_ACCOUNT_NUMBER,
    ifsc: process.env.COMPANY_IFSC || '',
    branch: process.env.COMPANY_BANK_BRANCH || '',
    accountType: 'Current',
  }];
}

function upiVpa() {
  return String(process.env.COMPANY_UPI_VPA || '').trim();
}

function upiLink({ amount, note }) {
  const vpa = upiVpa();
  if (!vpa) return '';
  const params = new URLSearchParams({
    pa: vpa,
    pn: '4TYREZZ',
    am: String(amount),
    cu: 'INR',
    tn: note || '4TYREZZ vehicle payment',
  });
  return `upi://pay?${params.toString()}`;
}

function parseAmount(value) {
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount) || amount < 1) {
    return { error: 'Enter a payment amount of at least ₹1' };
  }
  if (amount > MAX_OPEN_AMOUNT) {
    return { error: 'Amount is above the supported checkout limit' };
  }
  return { amount };
}

function purposeFor(amount, price) {
  if (price > 0 && amount >= price) return 'full';
  if (amount <= 10000) return 'token';
  return 'partial';
}

async function loadVehicle(vehicleId) {
  if (!vehicleId) return null;
  const car = await Car.findById(vehicleId);
  if (!car || !['approved', 'pending'].includes(car.status) || car.status === 'sold') return { missing: true };
  return { car };
}

async function openRazorpayOrder({ amount, receipt, notes, transfers }) {
  if (!keysConfigured()) {
    return paymentService.createOrder({ amount, receipt, notes, transfers });
  }
  const Razorpay = require('razorpay');
  const { keyId, keySecret } = razorpayKeys();
  const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const payload = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: String(receipt).slice(0, 40),
    notes,
  };
  if (Array.isArray(transfers) && transfers.length) payload.transfers = transfers;
  try {
    const order = await client.orders.create(payload);
    return { ...order, stub: false, keyId };
  } catch (err) {
    if (payload.transfers) {
      delete payload.transfers;
      const order = await client.orders.create(payload);
      return { ...order, stub: false, keyId };
    }
    throw err;
  }
}

function signaturesMatch(expected, signature) {
  const left = Buffer.from(String(expected));
  const right = Buffer.from(String(signature || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

exports.checkoutConfig = async (req, res) => {
  const vehicle = await loadVehicle(req.query.vehicleId);
  if (vehicle?.missing) return res.status(404).json({ message: 'Vehicle not available' });
  const price = Number(vehicle?.car?.price) || 0;
  const requested = Math.round(Number(req.query.amount));
  const amount = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, price || MAX_OPEN_AMOUNT)
    : (price || 5000);
  const link = upiLink({ amount, note: vehicle?.car?.title || '4TYREZZ' });
  let qrDataUrl = '';
  if (link) {
    qrDataUrl = await QRCode.toDataURL(link, { margin: 1, width: 280, errorCorrectionLevel: 'M' });
  }
  res.json({
    currency: 'INR',
    minAmount: 1,
    maxAmount: price || MAX_OPEN_AMOUNT,
    vehiclePrice: price,
    keyId: razorpayKeys().keyId,
    stub: !keysConfigured(),
    upiVpa: upiVpa(),
    upiLink: link,
    qrDataUrl,
    accounts: companyAccounts(),
  });
};

exports.createOrder = async (req, res) => {
  const parsed = parseAmount(req.body.amount);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const vehicle = await loadVehicle(req.body.vehicleId);
  if (vehicle?.missing) return res.status(404).json({ message: 'Vehicle not available for payment' });

  const car = vehicle?.car || null;
  const price = Number(car?.price) || 0;
  if (price > 0 && parsed.amount > price) {
    return res.status(400).json({ message: 'Amount cannot exceed the vehicle price' });
  }

  const purpose = ['token', 'partial', 'full'].includes(req.body.purpose)
    ? req.body.purpose
    : purposeFor(parsed.amount, price);
  const method = ['upi', 'card', 'netbanking', 'razorpay'].includes(req.body.method)
    ? req.body.method
    : 'razorpay';

  let dealerUser = null;
  if (car?.owner) {
    dealerUser = await User.findById(car.owner).select('razorpayAccountId');
  }
  const routeToDealer = car?.paymentRoute === 'dealer' && Boolean(dealerUser?.razorpayAccountId);
  const transfers = routeToDealer
    ? [{
      account: dealerUser.razorpayAccountId,
      amount: Math.round(parsed.amount * 100),
      currency: 'INR',
      notes: { carId: String(car._id) },
    }]
    : undefined;

  const booking = car
    ? await Booking.create({
      user: req.user._id,
      vehicle: car._id,
      dealer: car.owner,
      amount: parsed.amount,
      tokenAmount: parsed.amount,
      status: 'Payment Pending',
      notes: req.body.notes || `${purpose} payment for ${car.title}`,
      customerName: req.user.name || '',
      customerPhone: req.user.mobile || '',
      customerEmail: req.user.email || '',
    })
    : null;

  let order;
  try {
    order = await openRazorpayOrder({
      amount: parsed.amount,
      receipt: booking?.bookingRef || `4TZ${Date.now().toString(36).toUpperCase()}`,
      notes: {
        purpose,
        paymentId: '',
        bookingId: booking ? String(booking._id) : '',
        vehicleId: car ? String(car._id) : '',
        userId: String(req.user._id),
      },
      transfers,
    });
  } catch (err) {
    if (booking) {
      booking.status = 'Cancelled';
      await booking.save();
    }
    return res.status(502).json({ message: 'Payment order could not be created' });
  }

  if (booking) {
    booking.razorpayOrderId = order.id;
    await booking.save();
  }

  const payment = await Payment.create({
    booking: booking?._id,
    user: req.user._id,
    dealer: car?.owner,
    vehicle: car?._id,
    amount: parsed.amount,
    currency: 'INR',
    method,
    status: 'pending',
    provider: 'razorpay',
    providerOrderId: order.id,
    meta: {
      purpose,
      payee: routeToDealer ? 'dealer' : 'platform',
      vehicleTitle: car?.title || '',
      vehiclePrice: price,
      stub: !!order.stub,
    },
  });

  const note = car?.title || '4TYREZZ vehicle payment';
  const link = upiLink({ amount: parsed.amount, note });
  let qrDataUrl = '';
  if (link) qrDataUrl = await QRCode.toDataURL(link, { margin: 1, width: 280 });

  res.status(201).json({
    payment: {
      id: payment._id,
      orderId: order.id,
      amount: order.amount,
      amountRupees: parsed.amount,
      currency: order.currency || 'INR',
      keyId: order.keyId || razorpayKeys().keyId,
      stub: !!order.stub,
      purpose,
      bookingId: booking?._id || null,
      bookingRef: booking?.bookingRef || '',
      upiVpa: upiVpa(),
      upiLink: link,
      qrDataUrl,
    },
  });
};

exports.verifySignature = async (req, res) => {
  const orderId = req.body.razorpay_order_id || req.body.orderId;
  const paymentId = req.body.razorpay_payment_id || req.body.paymentId;
  const signature = req.body.razorpay_signature || req.body.signature;
  if (!orderId) return res.status(400).json({ message: 'Order id is required' });

  const payment = await Payment.findOne({ providerOrderId: orderId, user: req.user._id });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  if (payment.status === 'paid') {
    return res.json({ verified: true, data: payment });
  }

  const stubOrder = String(orderId).startsWith('order_stub_');
  let valid = false;
  let stub = false;
  if (!keysConfigured() || stubOrder) {
    valid = stubOrder;
    stub = true;
  } else if (paymentId && signature) {
    const expected = crypto
      .createHmac('sha256', razorpayKeys().keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    valid = signaturesMatch(expected, signature);
  }

  if (!valid) return res.status(400).json({ message: 'Invalid payment signature' });

  payment.status = 'paid';
  payment.providerPaymentId = paymentId || `pay_stub_${Date.now()}`;
  payment.invoiceRef = payment.invoiceRef || `INV-${Date.now().toString(36).toUpperCase()}`;
  payment.meta = { ...payment.meta, signatureVerified: !stub, stub };
  await payment.save();

  let booking = null;
  if (payment.booking) {
    booking = await Booking.findById(payment.booking);
    if (booking) {
      const full = Number(payment.meta?.vehiclePrice) > 0
        && payment.amount >= Number(payment.meta.vehiclePrice);
      booking.status = full ? 'Fully Paid' : 'Token Received';
      booking.razorpayPaymentId = payment.providerPaymentId;
      booking.paymentId = payment.providerPaymentId;
      booking.invoiceRef = payment.invoiceRef;
      await booking.save();
    }
  }

  await dispatchSafe({
    event: EVENTS.NEW_BOOKING,
    title: 'Payment received',
    message: `₹${payment.amount.toLocaleString('en-IN')} received${booking?.bookingRef ? ` on ${booking.bookingRef}` : ''}`,
    entityId: payment._id,
    meta: { paymentId: payment._id, bookingId: booking?._id, carId: payment.vehicle },
    adminOnly: true,
  });

  res.json({
    verified: true,
    stub,
    data: {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      invoiceRef: payment.invoiceRef,
      bookingId: booking?._id || null,
      bookingStatus: booking?.status || '',
    },
  });
};

exports.bankTransfer = async (req, res) => {
  const parsed = parseAmount(req.body.amount);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const vehicle = await loadVehicle(req.body.vehicleId);
  if (vehicle?.missing) return res.status(404).json({ message: 'Vehicle not available for payment' });
  const car = vehicle?.car || null;
  const price = Number(car?.price) || 0;
  if (price > 0 && parsed.amount > price) {
    return res.status(400).json({ message: 'Amount cannot exceed the vehicle price' });
  }
  if (!companyAccounts().length) {
    return res.status(400).json({ message: 'Company bank account is not configured yet' });
  }
  if (!req.file) return res.status(400).json({ message: 'Attach the transfer receipt' });

  const purpose = purposeFor(parsed.amount, price);
  const booking = car
    ? await Booking.create({
      user: req.user._id,
      vehicle: car._id,
      dealer: car.owner,
      amount: parsed.amount,
      tokenAmount: parsed.amount,
      status: 'Payment Pending',
      notes: req.body.reference
        ? `NEFT/RTGS ${req.body.reference}`
        : `NEFT/RTGS ${purpose} payment for ${car.title}`,
      customerName: req.user.name || '',
      customerPhone: req.user.mobile || '',
      customerEmail: req.user.email || '',
    })
    : null;

  const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : '';
  const payment = await Payment.create({
    booking: booking?._id,
    user: req.user._id,
    dealer: car?.owner,
    vehicle: car?._id,
    amount: parsed.amount,
    method: 'neft',
    status: 'pending',
    provider: 'bank-transfer',
    invoiceRef: req.body.reference || '',
    meta: {
      purpose,
      vehicleTitle: car?.title || '',
      vehiclePrice: price,
      receiptUrl,
      transferReference: req.body.reference || '',
      accountNumber: companyAccounts()[0].accountNumber,
    },
  });

  res.status(201).json({
    data: {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      bookingId: booking?._id || null,
      bookingRef: booking?.bookingRef || '',
      receiptUrl,
    },
  });
};
