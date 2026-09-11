/**
 * Marketplace valuation — Brand + Model + Year + Mileage + Owners + Condition.
 * 1) Optional external API (VALUATION_API_URL)
 * 2) Live comparable listings in Mongo
 * 3) Deterministic formula fallback
 */
const axios = require('axios');

const BRAND_INDEX = {
  'maruti suzuki': 0.92,
  hyundai: 0.96,
  tata: 0.9,
  honda: 1.02,
  toyota: 1.18,
  kia: 0.98,
  mahindra: 0.94,
  volkswagen: 1.04,
  skoda: 1.03,
  ford: 0.88,
  nissan: 0.9,
  renault: 0.86,
  mg: 0.97,
  bmw: 1.55,
  mercedes: 1.6,
  'mercedes-benz': 1.6,
  audi: 1.45,
  jaguar: 1.5,
  volvo: 1.35,
};

const BODY_BASE = {
  Hatchback: 480000,
  Sedan: 680000,
  SUV: 980000,
  MUV: 820000,
  Luxury: 1900000,
  Convertible: 1600000,
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundThousand(n) {
  return Math.round(n / 1000) * 1000;
}

function brandFactor(name = '') {
  const key = String(name).trim().toLowerCase();
  if (BRAND_INDEX[key]) return BRAND_INDEX[key];
  const hit = Object.keys(BRAND_INDEX).find((k) => key.includes(k) || k.includes(key));
  return hit ? BRAND_INDEX[hit] : 1;
}

function formulaEstimate(input = {}) {
  const year = Number(input.year) || new Date().getFullYear();
  const km = Number(input.kmDriven || input.mileage) || 50000;
  const owners = Number(input.ownership || input.ownerCount) || 1;
  const conditionScore = clamp(Number(input.conditionScore) || 7, 1, 10);
  const bodyType = input.bodyType || 'Sedan';
  const fuel = input.fuel || 'Petrol';
  const transmission = input.transmission || 'Manual';
  const brand = input.brandName || input.brand || '';
  const model = input.modelName || input.model || '';

  const age = Math.max(0, new Date().getFullYear() - year);
  let base = BODY_BASE[bodyType] || 720000;
  base *= brandFactor(brand);
  if (/fortuner|xuv700|innova|harrier|safari|hector/i.test(String(model))) base *= 1.12;
  if (/swift|i20|baleno|nexon|punch|sonet/i.test(String(model))) base *= 0.98;

  base *= Math.pow(0.915, age);

  const expectedKm = Math.max(age, 1) * 12000;
  const kmRatio = km / expectedKm;
  if (kmRatio > 1.4) base *= 0.88;
  else if (kmRatio > 1.15) base *= 0.94;
  else if (kmRatio < 0.65) base *= 1.08;

  if (owners >= 4) base *= 0.84;
  else if (owners === 3) base *= 0.88;
  else if (owners === 2) base *= 0.94;

  base *= 0.82 + conditionScore * 0.032;

  if (fuel === 'Electric') base *= 1.06;
  if (fuel === 'Hybrid') base *= 1.04;
  if (fuel === 'Diesel' && age > 8) base *= 0.93;
  if (fuel === 'CNG') base *= 0.97;
  if (transmission === 'Automatic') base *= 1.045;

  const estimate = Math.max(75000, roundThousand(base));
  const spread = estimate * (0.07 + (10 - conditionScore) * 0.006);
  const minPrice = Math.max(50000, roundThousand(estimate - spread));
  const maxPrice = Math.max(minPrice + 25000, roundThousand(estimate + spread));

  return {
    estimate,
    minPrice,
    maxPrice,
    currency: 'INR',
    source: 'formula',
    disclaimer: 'Indicative 4tyrezz market range — not a purchase offer. Final price depends on inspection.',
    breakdown: {
      brand,
      model,
      bodyType,
      age,
      km,
      owners,
      conditionScore,
      fuel,
      transmission,
      brandFactor: brandFactor(brand),
    },
  };
}

async function fromExternalApi(input) {
  const url = process.env.VALUATION_API_URL;
  if (!url) return null;
  try {
    const { data } = await axios.post(
      url,
      {
        brand: input.brandName || input.brand,
        model: input.modelName || input.model,
        year: Number(input.year),
        mileage: Number(input.kmDriven || input.mileage),
        ownerCount: Number(input.ownership || input.ownerCount),
        conditionScore: Number(input.conditionScore),
        fuel: input.fuel,
        transmission: input.transmission,
        bodyType: input.bodyType,
      },
      {
        timeout: Number(process.env.VALUATION_API_TIMEOUT || 4000),
        headers: process.env.VALUATION_API_KEY
          ? { Authorization: `Bearer ${process.env.VALUATION_API_KEY}` }
          : {},
      }
    );
    const estimate = Number(data.estimate || data.price || data.value);
    if (!estimate) return null;
    return {
      estimate: roundThousand(estimate),
      minPrice: roundThousand(Number(data.minPrice || estimate * 0.92)),
      maxPrice: roundThousand(Number(data.maxPrice || estimate * 1.08)),
      currency: data.currency || 'INR',
      source: 'external',
      disclaimer: data.disclaimer || 'Indicative estimate only — not a final purchase offer. Final price depends on inspection.',
      breakdown: { ...(data.breakdown || {}), provider: data.provider || 'external' },
    };
  } catch (err) {
    console.warn('[valuation] external API skipped:', err.message);
    return null;
  }
}

async function fromComparables(input) {
  try {
    const Car = require('../../models/Car');
    const year = Number(input.year) || new Date().getFullYear();
    const yearBand = { year: { $gte: year - 3, $lte: year + 2 } };
    const base = { status: 'approved', price: { $gt: 50000 }, ...yearBand };

    const queries = [];
    if (input.modelId) queries.push({ ...base, model: input.modelId });
    if (input.brandId) {
      queries.push({ ...base, brand: input.brandId, ...(input.bodyType ? { bodyType: input.bodyType } : {}) });
    }
    queries.push({ ...base, ...(input.bodyType ? { bodyType: input.bodyType } : {}) });

    let comps = [];
    for (const filter of queries) {
      const found = await Car.find(filter)
        .select('price year kmDriven ownership inspectionScore')
        .limit(40)
        .lean();
      if (found.length >= 3) {
        comps = found;
        break;
      }
    }

    if (comps.length < 3) return null;

    const prices = comps.map((c) => c.price).sort((a, b) => a - b);
    const mid = prices[Math.floor(prices.length / 2)];
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    let estimate = mid * 0.65 + avg * 0.35;

    const km = Number(input.kmDriven) || 50000;
    const avgKm = comps.reduce((s, c) => s + (c.kmDriven || 50000), 0) / comps.length;
    if (km > avgKm * 1.2) estimate *= 0.94;
    if (km < avgKm * 0.8) estimate *= 1.05;

    const owners = Number(input.ownership || input.ownerCount) || 1;
    if (owners >= 3) estimate *= 0.9;

    const conditionScore = clamp(Number(input.conditionScore) || 7, 1, 10);
    estimate *= 0.88 + conditionScore * 0.02;

    estimate = Math.max(75000, roundThousand(estimate));
    const spread = estimate * 0.09;
    return {
      estimate,
      minPrice: Math.max(50000, roundThousand(estimate - spread)),
      maxPrice: roundThousand(estimate + spread),
      currency: 'INR',
      source: 'comparables',
      comps: comps.length,
      disclaimer: `Indicative estimate from ${comps.length} live 4tyrezz listings — not a final purchase offer. Final price depends on inspection.`,
      breakdown: {
        brand: input.brandName || input.brand,
        model: input.modelName || input.model,
        comps: comps.length,
        median: roundThousand(mid),
        km,
        owners,
        conditionScore,
      },
    };
  } catch (err) {
    console.warn('[valuation] comps skipped:', err.message);
    return null;
  }
}

function pricePosition(ask, estimate, minPrice, maxPrice) {
  if (!ask || !estimate) return null;
  if (ask < minPrice) return 'great';
  if (ask <= estimate) return 'fair';
  if (ask <= maxPrice) return 'high';
  return 'overpriced';
}

const Vehicle = require('../../models/Vehicle');

function depreciationRemaining(age) {
  const curve = [1, 0.85, 0.75, 0.67, 0.6, 0.54, 0.49, 0.45, 0.41, 0.38, 0.35];
  if (age <= 10) return curve[age];
  return Math.max(0.18, 0.35 - (age - 10) * 0.02);
}

function demandScore({ brand, age, kmPerYear, owners }) {
  const b = String(brand).toLowerCase();
  const sticky = /toyota|honda|maruti|hyundai|mahindra|kia/.test(b);
  if (owners >= 4 || age > 14 || kmPerYear > 22000) return 'Low';
  if (sticky && age <= 8 && kmPerYear <= 15000 && owners === 1) return 'High';
  if (sticky && age <= 10) return 'High';
  return 'Medium';
}

async function lookupCatalogVehicle(input) {
  const brand = String(input.brandName || input.brand || '').trim();
  const model = String(input.modelName || input.model || '').trim();
  if (!brand || !model) return null;
  const filter = {
    brand: new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    model: new RegExp(`^${model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  };
  if (input.variant) {
    filter.variant = new RegExp(String(input.variant).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  return Vehicle.findOne(filter).lean();
}

function inferredMsrp(input, catalog) {
  if (catalog?.msrp) return catalog.msrp;
  const bodyType = catalog?.bodyType || input.bodyType || 'Sedan';
  let base = BODY_BASE[bodyType] || 720000;
  base *= brandFactor(input.brandName || input.brand);
  const model = String(input.modelName || input.model || '');
  if (/fortuner|xuv700|xuv 7xo|innova|harrier|safari|hector|scorpio-n|thar roxx/i.test(model)) base *= 1.18;
  if (catalog?.engineCc) base = Math.max(base, catalog.engineCc * 520);
  return roundThousand(base * 1.55);
}

async function calculateResale(input = {}) {
  const catalog = await lookupCatalogVehicle(input);
  const year = Number(input.year || input.registrationYear) || new Date().getFullYear();
  const km = Number(input.kmDriven || input.kilometersDriven || input.mileage) || 45000;
  const owners = Number(input.ownership || input.numberOfOwners || input.ownerCount) || 1;
  const conditionScore = clamp(Number(input.conditionScore) || 7, 1, 10);
  const brand = input.brandName || input.brand || catalog?.brand || '';
  const model = input.modelName || input.model || catalog?.model || '';
  const fuel = input.fuel || input.fuelType || catalog?.fuelType || 'Petrol';
  const transmission = input.transmission || catalog?.transmission || 'Manual';
  const bodyType = input.bodyType || catalog?.bodyType || 'Sedan';
  const age = Math.max(0, new Date().getFullYear() - year);

  const msrp = inferredMsrp({ ...input, brandName: brand, modelName: model, bodyType }, catalog);
  const retained = depreciationRemaining(age);
  let value = msrp * retained;

  const kmPerYear = km / Math.max(age, 1);
  const retentionDelta = brandFactor(brand) - 1;
  const priceFactors = {
    brandRetention: `${retentionDelta >= 0 ? '+' : ''}${Math.round(retentionDelta * 100)}%`,
  };

  value *= 1 + retentionDelta * 0.35;

  let kmAdj = 0;
  if (kmPerYear < 8000) {
    kmAdj = 15000;
    value += kmAdj;
    priceFactors.lowMileageBonus = `+₹${kmAdj.toLocaleString('en-IN')}`;
  } else if (kmPerYear < 12000) {
    kmAdj = 8000;
    value += kmAdj;
    priceFactors.lowMileageBonus = `+₹${kmAdj.toLocaleString('en-IN')}`;
  } else if (kmPerYear > 20000) {
    value *= 0.9;
    priceFactors.highMileagePenalty = '-10%';
  } else if (kmPerYear > 15000) {
    value *= 0.95;
    priceFactors.mileageAdjustment = '-5%';
  }

  if (owners >= 4) {
    value *= 0.84;
    priceFactors.ownership = '-16%';
  } else if (owners === 3) {
    value *= 0.88;
    priceFactors.ownership = '-12%';
  } else if (owners === 2) {
    value *= 0.94;
    priceFactors.ownership = '-6%';
  } else {
    priceFactors.ownership = '1st owner';
  }

  const condDelta = (conditionScore - 7) * 0.025;
  value *= 1 + condDelta;
  if (condDelta) {
    priceFactors.condition = `${condDelta > 0 ? '+' : ''}${Math.round(condDelta * 100)}%`;
  }

  if (fuel === 'Electric') value *= 1.05;
  if (fuel === 'Diesel' && age > 8) value *= 0.93;
  if (transmission === 'Automatic' || transmission === 'DCT' || transmission === 'CVT') value *= 1.03;

  const fairMarketValue = Math.max(75000, roundThousand(value));
  const spread = fairMarketValue * (0.055 + (10 - conditionScore) * 0.004);
  const estimatedMinPrice = Math.max(50000, roundThousand(fairMarketValue - spread));
  const estimatedMaxPrice = Math.max(estimatedMinPrice + 20000, roundThousand(fairMarketValue + spread));
  const demand = demandScore({ brand, age, kmPerYear, owners });

  return {
    success: true,
    valuation: {
      estimatedMinPrice,
      estimatedMaxPrice,
      fairMarketValue,
      demandScore: demand,
      priceFactors,
      msrp,
      depreciationApplied: `${Math.round((1 - retained) * 100)}%`,
    },
    estimate: fairMarketValue,
    minPrice: estimatedMinPrice,
    maxPrice: estimatedMaxPrice,
    currency: 'INR',
    source: catalog?.msrp ? 'catalog-msrp' : 'catalog-formula',
    disclaimer: 'Indicative 4TYREZZ SmartPrice range — not a purchase offer. Final price depends on inspection.',
    breakdown: {
      brand,
      model,
      variant: input.variant || catalog?.variant || '',
      bodyType,
      age,
      km,
      owners,
      conditionScore,
      fuel,
      transmission,
      msrp,
      retainedPct: Math.round(retained * 100),
    },
  };
}

async function estimateValue(input = {}) {
  const external = await fromExternalApi(input);
  if (external) return { ...external, position: pricePosition(Number(input.expectedPrice || input.price), external.estimate, external.minPrice, external.maxPrice) };

  const comps = await fromComparables(input);
  if (comps) return { ...comps, position: pricePosition(Number(input.expectedPrice || input.price), comps.estimate, comps.minPrice, comps.maxPrice) };

  const calculated = await calculateResale(input);
  return {
    ...calculated,
    position: pricePosition(Number(input.expectedPrice || input.price), calculated.estimate, calculated.minPrice, calculated.maxPrice),
  };
}

module.exports = { estimateValue, formulaEstimate, pricePosition, calculateResale };
