const fs = require('fs');
const Car = require('../models/Car');
const Lead = require('../models/Lead');
const LeadFollowUp = require('../models/LeadFollowUp');
const TestDrive = require('../models/TestDrive');
const TestDriveSlot = require('../models/TestDriveSlot');
const Booking = require('../models/Booking');
const PromotionCampaign = require('../models/PromotionCampaign');
const BulkUploadLog = require('../models/BulkUploadLog');
const { listingFieldsForCreate } = require('../utils/listingStatus');

const TEMPLATE_HEADERS = [
  'registration_no',
  'brand',
  'model',
  'variant',
  'year',
  'km_driven',
  'price',
  'fuel_type',
  'transmission',
  'city',
];

const REG_RX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

const CRM_COLUMNS = ['New Lead', 'Follow-Up', 'Negotiation', 'Test Drive Scheduled', 'Closed/Won', 'Lost'];

const PLANS = {
  hot_deal: { label: 'Hot Deal', days: 1, price: 199, field: 'isPremium' },
  sponsored: { label: 'Sponsored', days: 7, price: 499, field: 'isPremium' },
  featured: { label: 'Featured', days: 7, price: 499, field: 'isFeatured' },
};

function dealerId(req) {
  return req.user._id;
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else q = !q;
    } else if (ch === ',' && !q) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line, idx) => {
    const cols = splitCsvLine(line);
    const row = { _row: idx + 2 };
    headers.forEach((h, i) => {
      row[h] = String(cols[i] || '').trim();
    });
    return row;
  });
}

function normalizeFuel(v) {
  const s = String(v || '').toLowerCase();
  if (s.includes('diesel')) return 'Diesel';
  if (s.includes('electric')) return 'Electric';
  if (s.includes('hybrid')) return 'Hybrid';
  if (s.includes('cng')) return 'CNG';
  return 'Petrol';
}

function normalizeTrans(v) {
  const s = String(v || '').toLowerCase();
  if (s.includes('auto') || s.includes('amt') || s.includes('cvt')) return 'Automatic';
  return 'Manual';
}

function validateInventoryRow(row) {
  const errors = [];
  const registration_no = String(row.registration_no || row.registration || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const brand = row.brand || '';
  const model = row.model || '';
  const year = Number(row.year);
  const km_driven = Number(String(row.km_driven || row.kmdriven || '').replace(/,/g, ''));
  const price = Number(String(row.price || '').replace(/,/g, ''));
  if (!registration_no || !REG_RX.test(registration_no)) errors.push('Invalid registration number');
  if (!brand) errors.push('Missing brand');
  if (!model) errors.push('Missing model');
  if (!year || year < 1990 || year > new Date().getFullYear() + 1) errors.push('Invalid year');
  if (!price || price <= 0) errors.push('Missing price');
  if (Number.isNaN(km_driven)) errors.push('Invalid km');
  return {
    errors,
    data: {
      registration_no,
      brand,
      model,
      variant: row.variant || '',
      year,
      km_driven: Number.isNaN(km_driven) ? 0 : km_driven,
      price,
      fuel_type: normalizeFuel(row.fuel_type || row.fuel),
      transmission: normalizeTrans(row.transmission),
      city: row.city || 'Hyderabad',
    },
  };
}

function crmColumn(status) {
  const map = {
    New: 'New Lead',
    'New Lead': 'New Lead',
    Contacted: 'New Lead',
    'Follow-up': 'Follow-Up',
    'Follow-Up': 'Follow-Up',
    Negotiation: 'Negotiation',
    'Test Drive Scheduled': 'Test Drive Scheduled',
    Booked: 'Closed/Won',
    Sold: 'Closed/Won',
    Closed: 'Closed/Won',
    'Closed/Won': 'Closed/Won',
    Lost: 'Lost',
  };
  return map[status] || 'New Lead';
}

function followUpAlert(date) {
  if (!date) return 'Upcoming';
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(d);
  cmp.setHours(0, 0, 0, 0);
  if (cmp < today) return 'Overdue';
  if (cmp.getTime() === today.getTime()) return 'Today';
  return 'Upcoming';
}

function ledgerStatus(status) {
  const map = {
    Booked: 'Token Received',
    'Token Received': 'Token Received',
    'Payment Pending': 'Token Received',
    Confirmed: 'Token Received',
    'Financing Pending': 'Financing Pending',
    'Fully Paid': 'Fully Paid',
    Completed: 'Fully Paid',
    Cancelled: 'Cancelled/Refunded',
    Refunded: 'Cancelled/Refunded',
    'Cancelled/Refunded': 'Cancelled/Refunded',
  };
  return map[status] || status;
}

function driveStatus(status) {
  const map = {
    Requested: 'Scheduled',
    Confirmed: 'Scheduled',
    Rescheduled: 'Scheduled',
    Scheduled: 'Scheduled',
    'In Progress': 'In Progress',
    Completed: 'Completed',
    'Feedback Recorded': 'Feedback Recorded',
    'No-Show': 'No-Show',
    Cancelled: 'No-Show',
  };
  return map[status] || 'Scheduled';
}

exports.templateCsv = (_req, res) => {
  const sample = [
    TEMPLATE_HEADERS.join(','),
    'TS09AB1234,Maruti,Swift,VXI,2021,32000,575000,Petrol,Manual,Hyderabad',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="4tyrezz_bulk_inventory_template.csv"');
  res.send(sample);
};

exports.bulkUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'CSV file required' });
  const raw = fs.readFileSync(req.file.path, 'utf8');
  if (raw.startsWith('PK')) {
    return res.status(400).json({ message: 'Save the Excel sheet as CSV and upload again' });
  }
  const parsed = parseCsv(raw);
  const preview = parsed.map((row) => {
    const { errors, data } = validateInventoryRow(row);
    return { row: row._row, ...data, errors, valid: errors.length === 0 };
  });
  const confirm = String(req.body.confirm || req.query.confirm || '') === 'true';
  if (!confirm) {
    return res.json({ success: true, preview, total: preview.length, valid: preview.filter((r) => r.valid).length });
  }

  const imported = [];
  const failed = [];
  for (const row of preview.filter((r) => r.valid)) {
    try {
      const payload = await resolveListingRefs({
        brandName: row.brand,
        modelName: row.model,
        cityName: row.city,
        year: row.year,
        price: row.price,
        kmDriven: row.km_driven,
        variant: row.variant,
        fuel: row.fuel_type,
        transmission: row.transmission,
        bodyType: 'Hatchback',
        title: `${row.year} ${row.brand} ${row.model}`.trim(),
        rtoDetails: { rcNumber: row.registration_no, rcStatus: 'Active' },
      });
      const car = await Car.create({
        ...payload,
        owner: dealerId(req),
        sellerType: 'dealer',
        ...listingFieldsForCreate({ isAdmin: false }),
        description: 'Imported via bulk upload',
      });
      imported.push(car._id);
    } catch (e) {
      failed.push({ row: row.row, message: e.message });
    }
  }

  const log = await BulkUploadLog.create({
    dealer: dealerId(req),
    fileName: req.file.originalname,
    totalRows: preview.length,
    imported: imported.length,
    failed: failed.length + preview.filter((r) => !r.valid).length,
    rowErrors: [...preview.filter((r) => !r.valid).map((r) => ({ row: r.row, message: r.errors.join(', ') })), ...failed],
    carIds: imported,
  });

  res.json({ success: true, imported: imported.length, failed: log.failed, logId: log._id, preview });
};

exports.listCrmLeads = async (req, res) => {
  const leads = await Lead.find({ seller: dealerId(req) }).populate('car', 'title price year').sort('-createdAt').lean();
  const ids = leads.map((l) => l._id);
  const activities = await LeadFollowUp.find({ lead: { $in: ids } }).sort('-createdAt').lean();
  const byLead = {};
  activities.forEach((a) => {
    const key = String(a.lead);
    if (!byLead[key]) byLead[key] = [];
    byLead[key].push(a);
  });
  const data = leads.map((l) => {
    const column = crmColumn(l.status);
    const next = l.followUpAt;
    return {
      id: l._id,
      leadId: `L-${String(l._id).slice(-6).toUpperCase()}`,
      customerName: l.name,
      mobile: l.phone,
      carTitle: l.car?.title || '',
      status: l.status,
      column,
      followUpAt: next,
      alert: followUpAlert(next),
      message: l.message,
      activities: byLead[String(l._id)] || [],
      createdAt: l.createdAt,
    };
  });
  res.json({ success: true, columns: CRM_COLUMNS, data });
};

exports.updateLeadStatus = async (req, res) => {
  const status = req.body.status || req.body.column;
  const doc = await Lead.findOneAndUpdate(
    { _id: req.params.id, seller: dealerId(req) },
    { status },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Lead not found' });
  res.json({ success: true, data: doc });
};

exports.addLeadActivity = async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, seller: dealerId(req) });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  const nextFollowUpAt = req.body.nextFollowUpAt ? new Date(req.body.nextFollowUpAt) : null;
  const activity = await LeadFollowUp.create({
    lead: lead._id,
    dealer: dealerId(req),
    type: req.body.type || 'note',
    note: req.body.note || '',
    nextFollowUpAt,
  });
  lead.followUpAt = nextFollowUpAt || lead.followUpAt;
  if (req.body.note) lead.remarks = req.body.note;
  if (lead.status === 'New' || lead.status === 'New Lead') lead.status = 'Follow-Up';
  await lead.save();
  res.status(201).json({ success: true, data: activity });
};

exports.listTestDrives = async (req, res) => {
  const drives = await TestDrive.find({ dealer: dealerId(req) })
    .populate('vehicle', 'title price year')
    .sort('preferredDate')
    .lean();
  const slots = await TestDriveSlot.find({ dealer: dealerId(req) }).lean();
  const slotByDrive = Object.fromEntries(slots.map((s) => [String(s.testDrive), s]));
  res.json({
    success: true,
    data: drives.map((d) => {
      const slot = slotByDrive[String(d._id)] || {};
      return {
        id: d._id,
        customerName: d.customerName,
        mobile: d.customerPhone,
        carTitle: d.vehicle?.title || '',
        preferredDate: d.preferredDate,
        preferredTime: d.preferredTime || slot.slotTime || '',
        homeTestDrive: d.homeTestDrive,
        status: driveStatus(d.status),
        dlNumber: d.dlNumber || slot.dlNumber || '',
        feedback: d.feedback || slot.feedback || '',
        notes: d.notes,
      };
    }),
  });
};

exports.updateTestDrive = async (req, res) => {
  const drive = await TestDrive.findOne({ _id: req.params.id, dealer: dealerId(req) });
  if (!drive) return res.status(404).json({ message: 'Test drive not found' });
  if (req.body.status) drive.status = req.body.status;
  if (req.body.dlNumber != null) drive.dlNumber = String(req.body.dlNumber).toUpperCase();
  if (req.body.feedback != null) drive.feedback = req.body.feedback;
  if (req.body.dealerNotes != null) drive.dealerNotes = req.body.dealerNotes;
  if (req.body.preferredDate) drive.preferredDate = req.body.preferredDate;
  if (req.body.preferredTime != null) drive.preferredTime = req.body.preferredTime;
  await drive.save();
  await TestDriveSlot.findOneAndUpdate(
    { dealer: dealerId(req), testDrive: drive._id },
    {
      dealer: dealerId(req),
      testDrive: drive._id,
      vehicle: drive.vehicle,
      slotDate: drive.preferredDate,
      slotTime: drive.preferredTime,
      homeTestDrive: drive.homeTestDrive,
      dlNumber: drive.dlNumber,
      status: driveStatus(drive.status),
      feedback: drive.feedback,
      checklistComplete: Boolean(drive.dlNumber),
    },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: drive });
};

exports.listBookings = async (req, res) => {
  const data = await Booking.find({ dealer: dealerId(req) })
    .populate('vehicle', 'title price year')
    .populate('user', 'name mobile email')
    .sort('-createdAt')
    .lean();
  res.json({
    success: true,
    data: data.map((b) => ({
      id: b._id,
      bookingRef: b.bookingRef,
      customerName: b.customerName || b.user?.name || '',
      mobile: b.user?.mobile || '',
      carTitle: b.vehicle?.title || '',
      tokenAmount: b.tokenAmount || b.amount,
      paymentId: b.paymentId || b.razorpayPaymentId || '',
      bookingDate: b.createdAt,
      deliveryDeadline: b.deliveryDeadline,
      status: ledgerStatus(b.status),
      invoiceRef: b.invoiceRef,
    })),
  });
};

exports.bookingInvoice = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, dealer: dealerId(req) })
    .populate('vehicle', 'title price year')
    .populate('user', 'name mobile email')
    .populate('dealer', 'name dealershipName');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.invoiceRef = booking.invoiceRef || `INV-${booking.bookingRef}`;
  await booking.save();
  const html = `<!doctype html><html><head><title>${booking.invoiceRef}</title>
    <style>body{font-family:Montserrat,Arial,sans-serif;padding:32px;color:#111}h1{color:#3083ff}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{border-bottom:1px solid #eee;padding:8px;text-align:left}</style>
    </head><body>
    <h1>4TYREZZ Token Invoice</h1>
    <p>${booking.invoiceRef} · ${booking.bookingRef}</p>
    <table>
      <tr><th>Customer</th><td>${booking.user?.name || booking.customerName || ''}</td></tr>
      <tr><th>Vehicle</th><td>${booking.vehicle?.title || ''}</td></tr>
      <tr><th>Token</th><td>₹${Number(booking.tokenAmount || booking.amount).toLocaleString('en-IN')}</td></tr>
      <tr><th>Payment ID</th><td>${booking.paymentId || booking.razorpayPaymentId || '—'}</td></tr>
      <tr><th>Status</th><td>${ledgerStatus(booking.status)}</td></tr>
    </table>
    </body></html>`;
  res.json({ success: true, invoiceRef: booking.invoiceRef, html });
};

exports.updateBooking = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, dealer: dealerId(req) });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (req.body.status) booking.status = req.body.status;
  if (req.body.deliveryDeadline) booking.deliveryDeadline = req.body.deliveryDeadline;
  await booking.save();
  if (req.body.status === 'Fully Paid' || req.body.status === 'Completed') {
    await Car.findByIdAndUpdate(booking.vehicle, { status: 'sold' });
  }
  res.json({ success: true, data: booking });
};

exports.listPromotions = async (req, res) => {
  const [campaigns, cars] = await Promise.all([
    PromotionCampaign.find({ dealer: dealerId(req) }).populate('vehicle', 'title price views').sort('-createdAt').lean(),
    Car.find({ owner: dealerId(req), unpublished: { $ne: true }, status: { $in: ['approved', 'pending'] } }).select('title price views isFeatured isPremium listingStatus').sort('-createdAt').lean(),
  ]);
  res.json({
    success: true,
    plans: Object.entries(PLANS).map(([id, p]) => ({ id, ...p })),
    campaigns: campaigns.map((c) => ({
      ...c,
      ctr: c.impressions ? Number(((c.clicks / c.impressions) * 100).toFixed(1)) : 0,
      boost: c.impressions ? `×${Math.max(1, Math.round(c.impressions / 40))}` : '×1',
    })),
    inventory: cars,
  });
};

exports.boostPromotion = async (req, res) => {
  const { vehicleId, plan = 'featured' } = req.body;
  const spec = PLANS[plan] || PLANS.featured;
  const car = await Car.findOne({ _id: vehicleId, owner: dealerId(req) });
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const startAt = new Date();
  const endAt = new Date(Date.now() + spec.days * 86400000);
  car[spec.field] = true;
  await car.save();
  const campaign = await PromotionCampaign.create({
    dealer: dealerId(req),
    vehicle: car._id,
    plan,
    label: spec.label,
    durationDays: spec.days,
    price: spec.price,
    startAt,
    endAt,
    impressions: Number(car.views || 0),
    status: 'active',
  });
  res.status(201).json({ success: true, data: campaign });
};

exports.performance = async (req, res) => {
  const owner = dealerId(req);
  const cars = await Car.find({ owner }).select('brand model status createdAt updatedAt views title').populate('brand', 'name').populate('model', 'name').lean();
  const ids = cars.map((c) => c._id);
  const sold = cars.filter((c) => c.status === 'sold');
  const turnoverDays = sold.length
    ? Math.round(sold.reduce((sum, c) => sum + Math.max(1, (new Date(c.updatedAt) - new Date(c.createdAt)) / 86400000), 0) / sold.length)
    : 0;

  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  const monthlyMap = {};
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    monthlyMap[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = { month: d.toLocaleString('en-IN', { month: 'short' }), sold: 0, target: 4 };
  }
  sold.forEach((c) => {
    const key = `${new Date(c.updatedAt).getFullYear()}-${String(new Date(c.updatedAt).getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap[key]) monthlyMap[key].sold += 1;
  });

  const [leads, drives] = await Promise.all([
    Lead.countDocuments({ seller: owner }),
    TestDrive.countDocuments({ dealer: owner }),
  ]);
  const views = cars.reduce((s, c) => s + Number(c.views || 0), 0);
  const brandCount = {};
  cars.forEach((c) => {
    const name = c.brand?.name || 'Other';
    brandCount[name] = (brandCount[name] || 0) + Number(c.views || 0) + 1;
  });
  const topInventory = Object.entries(brandCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([brand, demand]) => ({ brand, demand }));

  res.json({
    success: true,
    data: {
      turnoverDays,
      sold: sold.length,
      listings: cars.length,
      monthly: Object.values(monthlyMap),
      funnel: [
        { stage: 'Views', value: views },
        { stage: 'Leads', value: leads },
        { stage: 'Test drives', value: drives },
        { stage: 'Closed sales', value: sold.length },
      ],
      topInventory,
    },
  });
};
