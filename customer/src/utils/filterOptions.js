// Shared budget / price buckets for Home, Explore By, and Listing.
// Query params are numeric rupees — labels may show ₹, search never requires the symbol.
export const PRICE_RANGES = [
  ['Under ₹1 Lakh', { maxPrice: 100000 }],
  ['₹1 – 2 Lakh', { minPrice: 100000, maxPrice: 200000 }],
  ['₹2 – 3 Lakh', { minPrice: 200000, maxPrice: 300000 }],
  ['₹3 – 5 Lakh', { minPrice: 300000, maxPrice: 500000 }],
  ['₹5 – 8 Lakh', { minPrice: 500000, maxPrice: 800000 }],
  ['₹8 – 10 Lakh', { minPrice: 800000, maxPrice: 1000000 }],
  ['₹10 – 15 Lakh', { minPrice: 1000000, maxPrice: 1500000 }],
  ['Above ₹15 Lakh', { minPrice: 1500000 }],
];

export const BUDGETS = PRICE_RANGES.map(([label, params]) => ({
  label,
  min: params.minPrice,
  max: params.maxPrice,
}));

function numOrEmpty(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : '';
}

export function isBudgetActive(budget, minPrice, maxPrice) {
  const min = numOrEmpty(minPrice);
  const max = numOrEmpty(maxPrice);
  const bMin = numOrEmpty(budget.min ?? budget.minPrice);
  const bMax = numOrEmpty(budget.max ?? budget.maxPrice);
  return min === bMin && max === bMax;
}

export function budgetQuery(budget) {
  const next = {};
  const min = budget.min ?? budget.minPrice;
  const max = budget.max ?? budget.maxPrice;
  if (min != null && min !== '') next.minPrice = min;
  if (max != null && max !== '') next.maxPrice = max;
  return next;
}

const LAKH_UNIT = '(lakhs|lakh|laks|lak|lacs|lac|lahks|lahk|lackhs|cr|crores|crore)';

export function normalizeBudgetText(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[₹,]/g, '')
    .replace(/\brs\.?\b/g, '')
    .replace(/\binr\b/g, '')
    .replace(/[–—−]/g, '-')
    .replace(/\bto\b/g, '-')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function looksLikeBudgetQuery(q) {
  const t = normalizeBudgetText(q);
  if (!t) return false;
  if (/\d/.test(t) && /(lakh|laks|lak|lac|crore|\bcr\b|budget|under|above|below)/.test(t)) return true;
  if (/^\d+(\s*-\s*\d+)?$/.test(t) && Number(t.split('-')[0]) <= 100) return true;
  return Boolean(parseBudgetQuery(q));
}

function unitToRupees(amount, unit) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return null;
  const u = String(unit || '').toLowerCase();
  if (u.startsWith('cr')) return Math.round(n * 10000000);
  if (!u && n >= 1000) return Math.round(n);
  return Math.round(n * 100000);
}

function namedBudget(minPrice, maxPrice, fallbackLabel) {
  const hit = BUDGETS.find((b) => isBudgetActive(b, minPrice, maxPrice));
  return {
    label: hit?.label || fallbackLabel,
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    min: minPrice || undefined,
    max: maxPrice || undefined,
  };
}

function plainHint(budget) {
  const minL = budget.minPrice || budget.min ? Math.round(Number(budget.minPrice || budget.min) / 100000) : null;
  const maxL = budget.maxPrice || budget.max ? Math.round(Number(budget.maxPrice || budget.max) / 100000) : null;
  if (maxL && !minL) return `Cars below ${maxL} lakh`;
  if (minL && !maxL) return `Cars above ${minL} lakh`;
  if (minL && maxL) return `Cars from ${minL} to ${maxL} lakh`;
  return 'Tap to see cars';
}

/** Parse header/search text like "10lakhs", "10 laks", "under 5 lakh". ₹ is optional. */
export function parseBudgetQuery(q) {
  const raw = String(q || '').trim();
  if (!raw) return null;
  const t = normalizeBudgetText(raw);
  if (!t) return null;

  const exact = BUDGETS.find((b) => normalizeBudgetText(b.label) === t);
  if (exact) return { label: exact.label, min: exact.min, max: exact.max, ...budgetQuery(exact) };

  const under = t.match(new RegExp(`^(?:under|below|upto|up to|less than|<)\\s*(\\d+(?:\\.\\d+)?)\\s*${LAKH_UNIT}?$`));
  if (under) {
    const maxPrice = unitToRupees(under[1], under[2] || 'lakh');
    if (maxPrice) return namedBudget('', maxPrice, `Under ₹${under[1]} Lakh`);
  }

  const above = t.match(new RegExp(`^(?:above|over|more than|>)\\s*(\\d+(?:\\.\\d+)?)\\s*${LAKH_UNIT}?$`));
  if (above) {
    const minPrice = unitToRupees(above[1], above[2] || 'lakh');
    if (minPrice) return namedBudget(minPrice, '', `Above ₹${above[1]} Lakh`);
  }

  const range = t.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*-\\s*(\\d+(?:\\.\\d+)?)\\s*${LAKH_UNIT}?$`));
  if (range) {
    const minPrice = unitToRupees(range[1], range[3] || 'lakh');
    const maxPrice = unitToRupees(range[2], range[3] || 'lakh');
    if (minPrice && maxPrice && minPrice < maxPrice) {
      return namedBudget(minPrice, maxPrice, `₹${range[1]} – ${range[2]} Lakh`);
    }
  }

  const single = t.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${LAKH_UNIT}$`));
  if (single) {
    const maxPrice = unitToRupees(single[1], single[2]);
    if (maxPrice) return namedBudget('', maxPrice, `Under ₹${single[1]} Lakh`);
  }

  const hits = BUDGETS.filter((b) => {
    const label = normalizeBudgetText(b.label);
    return t.length >= 2 && (label === t || label.includes(t));
  });
  if (hits.length === 1) return { label: hits[0].label, min: hits[0].min, max: hits[0].max, ...budgetQuery(hits[0]) };
  return null;
}

export function matchBudgets(q) {
  const t = normalizeBudgetText(q);
  if (!t) {
    return BUDGETS.map((b) => ({ ...b, hint: plainHint(b) }));
  }

  const parsed = parseBudgetQuery(q);
  const amount = Number((t.match(/(\d+(?:\.\d+)?)/) || [])[1]);
  const out = [];

  const push = (b, hint) => {
    if (!b?.label || out.some((row) => row.label === b.label)) return;
    const row = {
      label: b.label,
      min: b.min ?? b.minPrice,
      max: b.max ?? b.maxPrice,
      ...budgetQuery(b),
      hint: hint || plainHint(b),
    };
    out.push(row);
  };

  if (parsed) push(parsed, 'Best match — tap here');

  BUDGETS.forEach((b) => {
    const label = normalizeBudgetText(b.label);
    const lakhs = [b.min, b.max].filter((n) => n != null).map((n) => Math.round(Number(n) / 100000));
    const related = Number.isFinite(amount) && (
      label.includes(String(Math.trunc(amount)))
      || lakhs.includes(amount)
    );
    if (related || (t.length >= 2 && label.includes(t))) {
      push(b, 'Tap to see cars');
    }
  });

  return out;
}
export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
export const TRANSMISSIONS = ['Manual', 'Automatic'];
export const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'];
export const YEAR_RANGES = [
  ['2022 & newer', { minYear: 2022 }],
  ['2019 – 2021', { minYear: 2019, maxYear: 2021 }],
  ['2015 – 2018', { minYear: 2015, maxYear: 2018 }],
  ['Before 2015', { maxYear: 2014 }],
];
export const KM_RANGES = [
  ['Under 20,000 km', { maxKm: 20000 }],
  ['20,000 – 40,000 km', { minKm: 20000, maxKm: 40000 }],
  ['40,000 – 60,000 km', { minKm: 40000, maxKm: 60000 }],
  ['60,000 – 80,000 km', { minKm: 60000, maxKm: 80000 }],
  ['Above 80,000 km', { minKm: 80000 }],
];
export const OWNER_TYPES = [
  ['1st owner', { ownership: 1 }],
  ['2nd owner', { ownership: 2 }],
  ['3rd owner', { ownership: 3 }],
];
export const COLORS = ['White', 'Silver', 'Red', 'Black', 'Grey'];
