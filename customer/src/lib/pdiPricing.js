export const SEGMENT_PRICE = {
  NEW_CAR: { HATCH_SEDAN: 2499, SUV_LUXURY: 3499 },
  USED_CAR: { HATCH_SEDAN: 1999, SUV_LUXURY: 2799 },
};

export const PRIMARY_CITIES = [
  'Hyderabad',
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Chennai',
  'Pune',
  'Ahmedabad',
];

export const VISIT_FEE = 500;

export function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function cityVisitFee(city) {
  const key = String(city || '').trim().toLowerCase();
  if (!key) return 0;
  const included = PRIMARY_CITIES.some((name) => name.toLowerCase() === key || (key === 'bangalore' && name === 'Bengaluru') || (key === 'delhi' && name === 'Delhi NCR'));
  return included ? 0 : VISIT_FEE;
}

export function quoteSegment({ pdiType, vehicleSegment, city }) {
  const type = pdiType === 'NEW_CAR' ? 'NEW_CAR' : 'USED_CAR';
  const segment = vehicleSegment === 'SUV_LUXURY' ? 'SUV_LUXURY' : 'HATCH_SEDAN';
  const base = SEGMENT_PRICE[type][segment];
  const visit = cityVisitFee(city);
  return { base, visit, total: base + visit, vehicleSegment: segment, pdiType: type };
}

export function bookPath({ pdiType, vehicleSegment, city }) {
  const params = new URLSearchParams({
    type: pdiType === 'NEW_CAR' ? 'new' : 'used',
    segment: vehicleSegment === 'SUV_LUXURY' ? 'suv' : 'hatch',
  });
  if (city) params.set('city', city);
  return `/inspection/book?${params.toString()}`;
}
