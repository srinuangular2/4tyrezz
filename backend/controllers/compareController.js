const Car = require('../models/Car');
const { publicListingFilter } = require('../utils/listingStatus');
const { estimatedEmi } = require('../utils/emi');
const { buildSuggestedPairs } = require('../utils/comparePairs');

function dash(v) {
  if (v == null || v === '') return null;
  return v;
}

function claimedMileage(c) {
  const hits = (c.features || []).map(String).filter((f) => /\d+(\.\d+)?\s*(kmpl|km\/kg|km\/kwh|kwh\/100)/i.test(f));
  if (hits.length) {
    const m = hits[0].match(/\d+(\.\d+)?\s*(kmpl|km\/kg|km\/kwh|kwh\/100[a-z]*)/i);
    return m ? m[0] : hits[0];
  }
  return null;
}

function toMatrix(c) {
  const cond = c.quickInsights?.condition || {};
  const features = c.features || [];
  const safetyHits = features.filter((f) =>
    /airbag|abs|esp|ebd|hill|iso|camera|sensor|adas|brake/i.test(String(f))
  );
  const rto = c.rtoDetails || {};
  const check = c.inspectionChecklist || {};
  const emi = estimatedEmi(c.price);
  return {
    id: String(c._id),
    title: c.title,
    images: c.images,
    price: c.price,
    estimatedEmi: emi,
    year: c.year,
    registrationYear: c.registrationYear,
    kmDriven: c.kmDriven,
    fuel: c.fuel,
    transmission: c.transmission,
    bodyType: c.bodyType,
    ownership: c.ownership,
    color: c.color,
    interiorColor: c.interiorColor,
    variant: c.variant,
    seats: c.seats,
    engineDisplacement: c.engineDisplacement || rto.engineCapacityCC,
    inspectionScore: c.inspectionScore,
    features,
    safetyFeatures: safetyHits,
    claimedMileage: claimedMileage(c),
    insuranceType: c.insuranceType,
    warranty: {
      insuranceType: dash(c.insuranceType) || dash(cond.insuranceStatus),
      insuranceExpiry: dash(c.insuranceExpiry) || dash(rto.insuranceExpiryDate),
      pucExpiry: dash(c.pucExpiry) || dash(rto.puccValidUpto),
      fitnessValidUpto: dash(rto.fitnessValidUpto),
      inspectionReport: c.inspectionReport ? 'Available' : null,
      accidental: dash(check.accidental) || dash(cond.accidental),
      floodDamage: dash(check.floodDamage),
      serviceHistory: dash(check.serviceHistory) || dash(c.serviceHistoryLog),
    },
    marketPriceMin: c.quickInsights?.marketPriceMin,
    marketPriceMax: c.quickInsights?.marketPriceMax,
    condition: {
      accidental: cond.accidental || check.accidental || '—',
      odometerTampered: cond.odometerTampered || '—',
      insuranceStatus: cond.insuranceStatus || c.insuranceType || '—',
      kmCondition: cond.kmCondition || '—',
    },
    dealer: {
      name: '4tyrezz',
      city: c.city?.name || c.location?.city || '',
      sellerType: '',
    },
    brand: c.brand?.name,
    model: c.model?.name,
    city: c.city?.name || c.location?.city,
  };
}

function parseIds(req) {
  const raw = req.query.ids || req.body?.ids || '';
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

exports.compare = async (req, res) => {
  const ids = parseIds(req);
  if (ids.length < 1) {
    return res.status(400).json({ message: 'Provide 1–4 vehicle ids' });
  }

  const cars = await Car.find({ _id: { $in: ids }, ...publicListingFilter() })
    .populate('brand model city', 'name')
    .lean();

  const order = new Map(ids.map((id, i) => [id, i]));
  cars.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));

  res.json({ data: cars.map(toMatrix) });
};

/** Fair live pairings: similar budget / body — never consecutive latest or isFeatured. */
exports.suggested = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));

  const cars = await Car.find({ ...publicListingFilter(), images: { $exists: true, $ne: [] } })
    .populate('brand model city', 'name')
    .sort('-createdAt')
    .limit(200)
    .lean();

  const all = buildSuggestedPairs(cars, 40).map((edge) => ({
    id: `${edge.a._id}-${edge.b._id}`,
    ids: [String(edge.a._id), String(edge.b._id)],
    cars: [toMatrix(edge.a), toMatrix(edge.b)],
  }));

  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);

  res.json({
    data,
    page,
    limit,
    total: all.length,
    hasMore: start + data.length < all.length,
  });
};
