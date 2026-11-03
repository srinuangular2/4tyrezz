const SEGMENT_PRICE = {
  NEW_CAR: { HATCH_SEDAN: 2499, SUV_LUXURY: 3499 },
  USED_CAR: { HATCH_SEDAN: 1999, SUV_LUXURY: 2799 },
};

const PRIMARY_CITIES = [
  'hyderabad',
  'bengaluru',
  'bangalore',
  'mumbai',
  'delhi ncr',
  'delhi',
  'new delhi',
  'chennai',
  'pune',
  'ahmedabad',
];

const VISIT_FEE = 500;
const LEGACY_BASE = { UPTO_1249: 1299, ABOVE_1249: 1599, ELECTRIC: 1799 };
const OBD_FEE = 600;
const HISTORY_FEE = 400;

function cityVisitFee(city) {
  const key = String(city || '').trim().toLowerCase();
  if (!key) return 0;
  return PRIMARY_CITIES.includes(key) ? 0 : VISIT_FEE;
}

function quoteSegment({ pdiType, vehicleSegment, city }) {
  const type = pdiType === 'NEW_CAR' ? 'NEW_CAR' : 'USED_CAR';
  const segment = vehicleSegment === 'SUV_LUXURY' ? 'SUV_LUXURY' : 'HATCH_SEDAN';
  const base = SEGMENT_PRICE[type][segment];
  const visit = cityVisitFee(city);
  return { base, visit, total: base + visit, vehicleSegment: segment, pdiType: type };
}

function quoteLegacy({ pdiType, engineBand, obdScan, serviceHistory }) {
  const base = LEGACY_BASE[engineBand] || LEGACY_BASE.UPTO_1249;
  const history = pdiType === 'USED_CAR' && serviceHistory ? HISTORY_FEE : 0;
  return base + (obdScan ? OBD_FEE : 0) + history;
}

module.exports = {
  SEGMENT_PRICE,
  PRIMARY_CITIES,
  VISIT_FEE,
  LEGACY_BASE,
  OBD_FEE,
  HISTORY_FEE,
  cityVisitFee,
  quoteSegment,
  quoteLegacy,
};
