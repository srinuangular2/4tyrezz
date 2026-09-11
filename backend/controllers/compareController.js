const Car = require('../models/Car');
const { publicListingFilter } = require('../utils/listingStatus');
const { estimatedEmi } = require('../utils/emi');

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
    dealer: c.owner
      ? {
          id: c.owner._id,
          name: c.owner.dealershipName || c.owner.name,
          city: c.city?.name || c.location?.city || c.owner.city || '',
          sellerType: c.sellerType || '',
        }
      : null,
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
    .populate('brand model city owner', 'name dealershipName city')
    .lean();

  const order = new Map(ids.map((id, i) => [id, i]));
  cars.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));

  res.json({ data: cars.map(toMatrix) });
};

/** Live inventory pairings for the landing carousel — never a static list. */
exports.suggested = async (_req, res) => {
  const cars = await Car.find({ ...publicListingFilter(), images: { $exists: true, $ne: [] } })
    .populate('brand model city owner', 'name dealershipName city')
    .sort('-isFeatured -createdAt')
    .limit(24)
    .lean();

  const pairs = [];
  for (let i = 0; i < cars.length - 1 && pairs.length < 8; i += 2) {
    const a = cars[i];
    const b = cars[i + 1];
    if (!a || !b) break;
    pairs.push({
      id: `${a._id}-${b._id}`,
      ids: [String(a._id), String(b._id)],
      cars: [toMatrix(a), toMatrix(b)],
    });
  }

  res.json({ data: pairs });
};
