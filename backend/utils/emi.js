/** Indicative EMI used on car details (`EmiCalculator`): 10.5% p.a., 20% down, 60 months. */
const ANNUAL_RATE = 10.5;
const DOWN_PAYMENT_RATIO = 0.2;
const TENURE_MONTHS = 60;

function estimatedEmi(price, { downRatio = DOWN_PAYMENT_RATIO, months = TENURE_MONTHS, annualRate = ANNUAL_RATE } = {}) {
  const listed = Number(price);
  if (!Number.isFinite(listed) || listed <= 0) return null;
  const principal = Math.round(listed * (1 - downRatio));
  if (principal <= 0) return null;
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

module.exports = { estimatedEmi, ANNUAL_RATE, DOWN_PAYMENT_RATIO, TENURE_MONTHS };
