const Car = require('../models/Car');

function parseJsonField(val, fallback = null) {
  if (val == null || val === '') return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatKm(n) {
  if (n == null) return '—';
  return `${Number(n).toLocaleString('en-IN')} km`;
}

function ordinalOwner(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function buildFitForYou(car) {
  if (car.quickInsights?.fitForYou) return car.quickInsights.fitForYou;

  const bits = [];
  if (car.bodyType) {
    bits.push(`Well-suited ${car.bodyType.toLowerCase()} for city commutes and weekend trips`);
  }
  if (car.ownership === 1) {
    bits.push('single-owner history keeps service records transparent');
  } else if (car.ownership) {
    bits.push(`${ordinalOwner(car.ownership)} owner on record with verified documents`);
  }
  if (car.fuel === 'Electric') bits.push('zero tailpipe emissions for daily urban use');
  if (car.transmission === 'Automatic') bits.push('automatic gearbox for relaxed driving');
  return bits.length ? `${bits.join('. ')}.` : '';
}

function buildThingsToCheck(car) {
  const stored = car.quickInsights?.thingsToCheck?.filter(Boolean);
  if (stored?.length) return stored;

  const items = [];
  const age = car.year ? new Date().getFullYear() - car.year : null;

  if (car.kmDriven) {
    items.push(`${formatKm(car.kmDriven)} driven — inspect tyre tread, brake pads, and suspension on test drive`);
  }
  if (age != null && age >= 5) {
    items.push(`${age} years old — check rubber parts, battery health, and electrical connectors`);
  }
  if (car.fuel === 'Diesel') {
    items.push('Diesel powertrain — listen for turbo whine and verify clutch/shift feel');
  }
  if (car.insuranceType === 'Expired' || car.quickInsights?.condition?.insuranceStatus === 'Expired') {
    items.push('Insurance expired — budget for renewal before transfer');
  }
  return items;
}

function getKmCondition(car) {
  const stored = car.quickInsights?.condition?.kmCondition;
  if (stored) return stored;

  const age = car.year ? Math.max(1, new Date().getFullYear() - car.year) : null;
  if (!car.kmDriven || !age) return 'Normal';

  const avgPerYear = car.kmDriven / age;
  if (avgPerYear < 8000) return 'Below average';
  if (avgPerYear > 18000) return 'Above average';
  return 'Normal';
}

function getPriceVerdict(price, min, max) {
  if (price == null || min == null || max == null) return null;
  if (price <= min) return { label: 'Great Price', tone: 'great' };
  if (price <= max) return { label: 'Fair Price', tone: 'fair' };
  return { label: 'Above Market', tone: 'high' };
}

function buildGoodBuyReason(car, marketMin, marketMax) {
  if (car.quickInsights?.goodBuyReason) return car.quickInsights.goodBuyReason;

  const verdict = getPriceVerdict(car.price, marketMin, marketMax);
  if (verdict?.tone === 'great') {
    return `Priced below comparable listings — a strong value for a ${car.year || ''} ${car.brand?.name || ''} ${car.model?.name || ''}`.trim();
  }
  if (verdict?.tone === 'fair') {
    return `Asking price sits within the market range for similar ${car.bodyType || 'cars'} in ${car.city?.name || 'this city'}.`;
  }
  if (verdict?.tone === 'high') {
    return `Listed above typical market range — negotiate using comparable listings as reference.`;
  }
  return `Verified listing with complete specs for a ${ordinalOwner(car.ownership || 1)} owner ${car.fuel || ''} ${car.transmission || ''} variant.`.trim();
}

function hasText(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s !== '' && s !== '—' && !/^n\/?a$/i.test(s);
}

function documentUrlSet(car) {
  const docs = car.listingDocuments || {};
  return new Set(
    [docs.rcCopy, docs.insurancePolicy, docs.serviceHistory, car.inspectionReport]
      .filter(Boolean)
      .map(String)
  );
}

function listingPhotos(car) {
  const blocked = documentUrlSet(car);
  return (car.images || []).filter((url) => {
    if (!url) return false;
    const u = String(url);
    if (blocked.has(u)) return false;
    if (/\.pdf($|\?)/i.test(u)) return false;
    return true;
  });
}

function isInventedRegDate(value, car) {
  const s = String(value || '').trim();
  const m = s.match(/^01[-/\s]Jan(?:uary)?[-/\s](\d{4})$/i);
  if (!m) return false;
  const y = Number(m[1]);
  return y === Number(car.registrationYear || car.year);
}

function buildRtoDetails(car) {
  const rto = car.rtoDetails || {};
  const registrationDate = isInventedRegDate(rto.registrationDate, car) ? '' : (rto.registrationDate || '');
  const hasRcFacts = Boolean(
    hasText(registrationDate) ||
    hasText(rto.insuranceCompany) ||
    hasText(rto.fitnessValidUpto) ||
    hasText(rto.engineCapacityCC)
  );
  const storedStatus = String(rto.rcStatus || '').trim();
  const rcStatus = storedStatus && (hasRcFacts || storedStatus.toLowerCase() !== 'active') ? storedStatus : '';

  return {
    rcNumber: rto.rcNumber || '',
    rcStatus,
    registrationDate,
    registrationYear: rto.registrationYear || car.registrationYear || '',
    rtoLocation: rto.rtoLocation || car.rto || '',
    insuranceExpiryDate: rto.insuranceExpiryDate || car.insuranceExpiry || '',
    insuranceCompany: rto.insuranceCompany || '',
    engineCapacityCC: rto.engineCapacityCC ?? car.engineDisplacement ?? null,
    puccValidUpto: rto.puccValidUpto || car.pucExpiry || '',
    fitnessValidUpto: rto.fitnessValidUpto || '',
    insuranceType: car.insuranceType || rto.insuranceType || '',
    color: car.color || rto.color || '',
    fuel: car.fuel || rto.fuel || '',
    bodyType: car.bodyType || rto.bodyType || '',
    documentsOnFile: Boolean(
      car.listingDocuments?.rcCopy || car.listingDocuments?.insurancePolicy || car.listingDocuments?.serviceHistory
    ),
  };
}

async function estimateMarketRange(car) {
  const storedMin = car.quickInsights?.marketPriceMin;
  const storedMax = car.quickInsights?.marketPriceMax;
  if (storedMin != null && storedMax != null) {
    return { min: storedMin, max: storedMax };
  }

  const stats = await Car.aggregate([
    {
      $match: {
        status: 'approved',
        _id: { $ne: car._id },
        brand: car.brand?._id || car.brand,
        model: car.model?._id || car.model,
        year: { $gte: (car.year || 2020) - 2, $lte: (car.year || 2020) + 2 },
      },
    },
    {
      $group: {
        _id: null,
        min: { $min: '$price' },
        max: { $max: '$price' },
        avg: { $avg: '$price' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats[0]?.count >= 2) {
    return { min: stats[0].min, max: stats[0].max, avg: Math.round(stats[0].avg) };
  }

  const band = Math.round((car.price || 500000) * 0.12);
  return {
    min: Math.max(0, (car.price || 0) - band),
    max: (car.price || 0) + band,
    avg: car.price,
    estimated: true,
  };
}

async function enrichCarForDetail(carDoc, extras = {}) {
  const car = carDoc.toObject ? carDoc.toObject() : { ...carDoc };
  if (extras.dealerProfile) car.dealerProfile = extras.dealerProfile;
  const market = await estimateMarketRange(car);
  const kmCondition = getKmCondition(car);
  const priceVerdict = getPriceVerdict(car.price, market.min, market.max);
  const condition = {
    accidental: car.quickInsights?.condition?.accidental || 'No',
    odometerTampered: car.quickInsights?.condition?.odometerTampered || 'No',
    insuranceStatus: car.quickInsights?.condition?.insuranceStatus || (car.insuranceType === 'Expired' ? 'Expired' : 'Valid'),
    kmCondition,
  };

  car.quickInsights = {
    ...(car.quickInsights || {}),
    goodBuyReason: buildGoodBuyReason(car, market.min, market.max),
    marketPriceMin: market.min,
    marketPriceMax: market.max,
    marketPriceAvg: market.avg,
    marketEstimated: !!market.estimated,
    fitForYou: buildFitForYou(car),
    thingsToCheck: buildThingsToCheck(car),
    condition,
    priceVerdict,
  };

  car.rtoDetails = buildRtoDetails(car);
  if (!extras.staffView && car.rtoDetails) {
    delete car.rtoDetails.documentsOnFile;
  }

  const owner = car.owner || {};
  const dealerProfile = car.dealerProfile || null;
  const phone = dealerProfile?.contactPhone || owner.mobile || '';
  const loc = car.location || {};
  car.photos = listingPhotos(car);
  if (!extras.staffView) {
    car.images = car.photos;
    delete car.listingDocuments;
    delete car.inspectionReport;
  }
  car.emiDetails = {
    defaultRate: Number(process.env.FINANCE_DEFAULT_RATE || 10.5),
    defaultTenureMonths: Number(process.env.FINANCE_DEFAULT_TENURE || 60),
    downPaymentPercent: 10,
    suggestedLoan: Math.round((car.price || 0) * 0.9),
  };
  car.specs = {
    year: car.year,
    registrationYear: car.registrationYear || car.year,
    kmDriven: car.kmDriven,
    fuel: car.fuel,
    transmission: car.transmission,
    bodyType: car.bodyType,
    color: car.color,
    ownerCount: car.ownership,
    rto: car.rtoDetails?.rtoLocation || car.rto || '',
    registrationState: loc.state || car.city?.state || '',
  };
  const insuranceExpiry = car.insuranceExpiry || car.rtoDetails?.insuranceExpiryDate || '';
  const pucExpiry = car.pucExpiry || car.rtoDetails?.puccValidUpto || '';
  car.compliance = {
    insuranceType: car.insuranceType || '',
    insuranceExpiry,
    insuranceValidity: formatValidityLabel(car.insuranceType, insuranceExpiry, condition.insuranceStatus),
    pucExpiry,
    pucValidity: formatValidityLabel('PUC', pucExpiry, pucExpiry ? '' : 'Not listed'),
  };
  car.history = {
    serviceLogs: parseServiceLogs(car.serviceHistoryLog),
    accidentHistory: car.accidentDetails || condition.accidental || '',
    ownershipChain: ownerLabelHistory(car.ownership),
    serviceHistory: car.inspectionChecklist?.serviceHistory || car.serviceHistoryLog || '',
  };
  const checklist = car.inspectionChecklist || {};
  car.inspection = {
    ratingScore: car.inspectionScore,
    reportPdfUrl: car.inspectionReport || car.listingDocuments?.serviceHistory || '',
    checklist,
    categories: [
      { label: 'Engine', value: checklist.engineState || '' },
      { label: 'Suspension', value: checklist.tyreCondition != null ? `Tyres ${checklist.tyreCondition}/10` : '' },
      { label: 'Brakes', value: checklist.brakes || '' },
      { label: 'Exterior', value: checklist.accidental === 'Yes' ? 'Accident flagged' : checklist.accidental || '' },
      { label: 'Interior', value: checklist.floodDamage === 'Yes' ? 'Flood damage flagged' : checklist.floodDamage || '' },
    ].filter((row) => row.value),
  };
  const { companyDealerCard } = require('./companyContact');
  if (!extras.staffView) {
    car.dealer = companyDealerCard();
    delete car.owner;
    delete car.dealerProfile;
    delete car.sellerType;
    return car;
  }
  car.dealer = {
    name: dealerProfile?.businessName || owner.dealershipName || owner.name || 'Private Seller',
    phone,
    whatsapp: phone,
    address: [dealerProfile?.addressLine1, dealerProfile?.city, dealerProfile?.state, dealerProfile?.pincode]
      .filter(Boolean)
      .join(', ') || loc.formattedAddress || car.city?.name || '',
    coordinates: dealerProfile?.geo?.lat != null
      ? { lat: dealerProfile.geo.lat, lng: dealerProfile.geo.lng }
      : loc.coordinates || null,
    verifiedStatus: dealerProfile?.kycVerified || dealerProfile?.onboardingStatus === 'APPROVED' || car.sellerType === 'dealer',
  };
  return car;
}

function parseServiceLogs(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((row) => ({
        date: row.date || row.servicedAt || '',
        odometer: row.odometer || row.km || row.kmDriven || '',
        center: row.center || row.workshop || row.location || '',
        authorized: !!(row.authorized || row.authorised || row.dealer),
        notes: row.notes || row.summary || '',
      }));
    }
  } catch {
    /* plain text */
  }
  return String(raw)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      date: '',
      odometer: '',
      center: line,
      authorized: /dealer|authorized|authorised/i.test(line),
      notes: line,
    }));
}

function ownerLabelHistory(n) {
  if (!n) return '';
  if (n === 1) return 'Single private owner';
  return `${n} recorded owners`;
}

function formatValidityLabel(kind, expiry, fallback = '') {
  if (!expiry && fallback) return fallback;
  if (!expiry) return '';
  const d = new Date(expiry);
  const stamp = Number.isNaN(d.getTime())
    ? String(expiry)
    : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const active = Number.isNaN(d.getTime()) ? true : d.getTime() >= Date.now();
  const status = active ? `Active till ${stamp}` : `Expired ${stamp}`;
  return kind ? `${kind} — ${status}` : status;
}

function parseCarNestedFields(body) {
  const data = { ...body };

  if (data.features !== undefined) data.features = parseJsonField(data.features, []);
  if (data.quickInsights !== undefined) data.quickInsights = parseJsonField(data.quickInsights, {});
  if (data.rtoDetails !== undefined) data.rtoDetails = parseJsonField(data.rtoDetails, {});
  if (data.existingImages !== undefined) data.existingImages = parseJsonField(data.existingImages, []);
  if (data.inspectionChecklist !== undefined) data.inspectionChecklist = parseJsonField(data.inspectionChecklist, {});
  if (data.mediaSlots !== undefined) data.mediaSlots = parseJsonField(data.mediaSlots, {});
  if (data.listingDocuments !== undefined) data.listingDocuments = parseJsonField(data.listingDocuments, {});
  if (data.imageSlots !== undefined) data.imageSlots = parseJsonField(data.imageSlots, []);
  if (data.location !== undefined) data.location = parseJsonField(data.location, data.location);

  const numericFields = ['year', 'price', 'kmDriven', 'ownership', 'seats', 'registrationYear', 'engineDisplacement', 'inspectionScore', 'conditionScore'];
  numericFields.forEach((key) => {
    if (data[key] !== undefined && data[key] !== '' && data[key] !== null) {
      data[key] = Number(data[key]);
    }
  });

  return data;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

function isObjectId(value) {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}

async function resolveListingRefs(payload = {}) {
  const Brand = require('../models/Brand');
  const CarModel = require('../models/CarModel');
  const City = require('../models/City');
  const next = { ...payload };

  const brandName = next.brandName || (!isObjectId(next.brand) ? next.brand : '');
  if (brandName && !isObjectId(next.brand)) {
    const rx = new RegExp(`^${String(brandName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let brand = await Brand.findOne({ name: rx });
    if (!brand) brand = await Brand.create({ name: String(brandName).trim(), slug: slugify(brandName) });
    next.brand = brand._id;
  }

  const modelName = next.modelName || (!isObjectId(next.model) ? next.model : '');
  if (modelName && next.brand && !isObjectId(next.model)) {
    const rx = new RegExp(`^${String(modelName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let model = await CarModel.findOne({ brand: next.brand, name: rx });
    if (!model) {
      model = await CarModel.create({
        name: String(modelName).trim(),
        slug: slugify(modelName),
        brand: next.brand,
        bodyType: next.bodyType || '',
      });
    }
    next.model = model._id;
  }

  const cityName = next.cityName || (!isObjectId(next.city) ? next.city : '');
  if (cityName && !isObjectId(next.city)) {
    const rx = new RegExp(`^${String(cityName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let city = await City.findOne({ name: rx });
    if (!city) city = await City.create({ name: String(cityName).trim() });
    next.city = city._id;
  }
  if (!next.city) {
    const fallback = await City.findOne().sort({ isPopular: -1, name: 1 });
    if (fallback) next.city = fallback._id;
  }

  delete next.brandName;
  delete next.modelName;
  delete next.cityName;
  return next;
}

module.exports = {
  parseJsonField,
  parseCarNestedFields,
  enrichCarForDetail,
  getPriceVerdict,
  getKmCondition,
  resolveListingRefs,
  listingPhotos,
  documentUrlSet,
};
