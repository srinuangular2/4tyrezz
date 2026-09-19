const fs = require('fs');
const XLSX = require('xlsx');
const Car = require('../models/Car');
const Lead = require('../models/Lead');
const LeadFollowUp = require('../models/LeadFollowUp');
const TestDrive = require('../models/TestDrive');
const TestDriveSlot = require('../models/TestDriveSlot');
const Booking = require('../models/Booking');
const PromotionCampaign = require('../models/PromotionCampaign');
const BulkUploadLog = require('../models/BulkUploadLog');
const { listingFieldsForCreate } = require('../utils/listingStatus');
const { resolveListingRefs } = require('../utils/carInsights');

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

function normalizeHeader(value) {
  const key = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const aliases = {
    registration: 'registration_no',
    registration_number: 'registration_no',
    registration_no: 'registration_no',
    reg_no: 'registration_no',
    regno: 'registration_no',
    km: 'km_driven',
    kms: 'km_driven',
    kmdriven: 'km_driven',
    kilometer: 'km_driven',
    kilometres: 'km_driven',
    fuel: 'fuel_type',
    fueltype: 'fuel_type',
    gearbox: 'transmission',
  };
  return aliases[key] || key;
}

function parseCsv(text, delimiter) {
  const split = delimiter === '\t'
    ? (line) => line.split('\t')
    : splitCsvLine;
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = split(lines[0]).map((h) => normalizeHeader(h));
  return lines.slice(1).map((line, idx) => {
    const cols = split(line);
    const row = { _row: idx + 2 };
    headers.forEach((h, i) => {
      row[h] = String(cols[i] || '').trim();
    });
    return row;
  });
}

function rowsFromSheet(sheet) {
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return json.map((obj, idx) => {
    const row = { _row: idx + 2 };
    Object.entries(obj).forEach(([key, value]) => {
      row[normalizeHeader(key)] = String(value || '').trim();
    });
    return row;
  });
}

function parseBulkFile(filePath, originalName = '') {
  const name = String(originalName || filePath).toLowerCase();
  const buf = fs.readFileSync(filePath);
  const isSpreadsheet = /\.(xlsx|xls|xlsm|xlsb|ods)$/.test(name)
    || buf.slice(0, 2).toString() === 'PK'
    || buf[0] === 0xD0;
  if (isSpreadsheet) {
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const first = workbook.Sheets[workbook.SheetNames[0]];
    if (!first) return [];
    return rowsFromSheet(first);
  }
  const text = buf.toString('utf8');
  if (name.endsWith('.tsv') || (text.includes('\t') && (text.match(/\t/g) || []).length > (text.match(/,/g) || []).length)) {
    return parseCsv(text, '\t');
  }
  return parseCsv(text);
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

function inferBodyType(model, variant) {
  const s = `${model || ''} ${variant || ''}`.toLowerCase();
  if (/suv|creta|seltos|venue|thar|scorpio|xuv|fortuner|nexon|brezza|sonet|harrier|safari|alcazar/.test(s)) return 'SUV';
  if (/sedan|city|dzire|ciaz|verna|slavia|virtus|amaze|aura/.test(s)) return 'Sedan';
  if (/muv|innova|ertiga|xl6|carens|eeco|triber/.test(s)) return 'MUV';
  return 'Hatchback';
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
  if (!req.file) return res.status(400).json({ message: 'Upload a CSV or Excel file' });
  let parsed = [];
  try {
    parsed = parseBulkFile(req.file.path, req.file.originalname);
  } catch (err) {
    return res.status(400).json({ message: 'Could not read this file. Use CSV, Excel or ODS.' });
  }
  if (!parsed.length) return res.status(400).json({ message: 'No data rows found in the file' });
  const preview = parsed.map((row) => {
    const { errors, data } = validateInventoryRow(row);
    return { row: row._row, ...data, errors, valid: errors.length === 0 };
  });
  const confirm = ['true', '1', 'yes'].includes(String(req.body.confirm || req.query.confirm || '').toLowerCase());
  if (!confirm) {
    return res.json({ success: true, preview, total: preview.length, valid: preview.filter((r) => r.valid).length });
  }

  const imported = [];
  const failed = [];
  for (const row of preview.filter((r) => r.valid)) {
    try {
      const refs = await resolveListingRefs({
        brandName: row.brand,
        modelName: row.model,
        cityName: row.city,
        year: Number(row.year),
        price: Number(row.price),
        kmDriven: Number(row.km_driven) || 0,
        variant: row.variant,
        fuel: row.fuel_type,
        transmission: row.transmission,
        bodyType: inferBodyType(row.model, row.variant),
        title: `${row.year} ${row.brand} ${row.model}`.trim(),
        rtoDetails: { rcNumber: row.registration_no, rcStatus: 'Active' },
      });
      if (!refs.brand || !refs.model || !refs.city) {
        throw new Error('Could not match brand, model or city');
      }
      const car = await Car.create({
        title: refs.title,
        brand: refs.brand,
        model: refs.model,
        variant: refs.variant || '',
        year: refs.year,
        price: refs.price,
        fuel: refs.fuel,
        transmission: refs.transmission,
        bodyType: refs.bodyType,
        kmDriven: refs.kmDriven,
        city: refs.city,
        owner: dealerId(req),
        sellerType: 'dealer',
        location: { city: row.city || '', formattedAddress: row.city || '' },
        rto: row.city || '',
        rtoDetails: refs.rtoDetails,
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

exports.listCrmLeads = async (_req, res) => {
  res.json({ success: true, data: [] });
};

exports.updateLeadStatus = async (_req, res) => {
  return res.status(403).json({ message: 'Buyer leads are handled by 4tyrezz admin' });
};

exports.addLeadActivity = async (_req, res) => {
  return res.status(403).json({ message: 'Buyer leads are handled by 4tyrezz admin' });
};

exports.listTestDrives = async (_req, res) => {
  res.json({ success: true, data: [], slots: [] });
};

exports.updateTestDrive = async (_req, res) => {
  return res.status(403).json({ message: 'Customer bookings are handled by 4tyrezz admin' });
};

exports.listBookings = async (_req, res) => {
  res.json({ success: true, data: [] });
};

exports.bookingInvoice = async (_req, res) => {
  return res.status(403).json({ message: 'Customer bookings are handled by 4tyrezz admin' });
};

exports.updateBooking = async (_req, res) => {
  return res.status(403).json({ message: 'Customer bookings are handled by 4tyrezz admin' });
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
        { stage: 'Pending', value: cars.filter((c) => c.status === 'pending').length },
        { stage: 'Live', value: cars.filter((c) => c.status === 'approved').length },
        { stage: 'Closed sales', value: sold.length },
      ],
      topInventory,
    },
  });
};
