// Keep in sync with customer/src/utils/filterOptions.js PRICE_RANGES.
const PRICE_BUCKETS = [
  { label: 'Under ₹1 Lakh', max: 100000 },
  { label: '₹1 – 2 Lakh', min: 100000, max: 200000 },
  { label: '₹2 – 3 Lakh', min: 200000, max: 300000 },
  { label: '₹3 – 5 Lakh', min: 300000, max: 500000 },
  { label: '₹5 – 8 Lakh', min: 500000, max: 800000 },
  { label: '₹8 – 10 Lakh', min: 800000, max: 1000000 },
  { label: '₹10 – 15 Lakh', min: 1000000, max: 1500000 },
  { label: 'Above ₹15 Lakh', min: 1500000 },
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function budgetIndex(price) {
  const p = num(price);
  if (p <= 0) return -1;
  if (p < 100000) return 0;
  if (p < 200000) return 1;
  if (p < 300000) return 2;
  if (p < 500000) return 3;
  if (p < 800000) return 4;
  if (p < 1000000) return 5;
  if (p < 1500000) return 6;
  return 7;
}

function sameBudgetBucket(a, b) {
  const ia = budgetIndex(a);
  const ib = budgetIndex(b);
  return ia >= 0 && ia === ib;
}

module.exports = { PRICE_BUCKETS, budgetIndex, sameBudgetBucket, num };
