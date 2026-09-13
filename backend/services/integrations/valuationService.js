/**
 * Spinny / CarDekho-style used-car valuation.
 * Same model only — never mix a Swift with a Baleno or a hatch with an SUV.
 *
 * 1) Optional external API (VALUATION_API_URL)
 * 2) Live same-model listings (rejected if they look like outliers vs guide)
 * 3) Guide MSRP × Indian depreciation × km / owners / condition
 */
const axios = require('axios');

const BRAND_INDEX = {
  'maruti suzuki': 0.96,
  maruti: 0.96,
  hyundai: 0.97,
  tata: 0.93,
  honda: 1.02,
  toyota: 1.12,
  kia: 0.98,
  mahindra: 0.96,
  volkswagen: 1.0,
  skoda: 1.0,
  ford: 0.88,
  nissan: 0.9,
  renault: 0.88,
  mg: 0.96,
  bmw: 1.2,
  mercedes: 1.22,
  'mercedes-benz': 1.22,
  audi: 1.16,
  jaguar: 1.12,
  volvo: 1.1,
};

/** Typical current ex-showroom mid-variant, INR. Used as the “new list” anchor. */
const MODEL_GUIDE = {
  alto: 450000,
  'alto k10': 500000,
  celerio: 620000,
  wagonr: 650000,
  'wagon r': 650000,
  swift: 815000,
  dzire: 850000,
  baleno: 840000,
  ignis: 680000,
  brezza: 1050000,
  'vitara brezza': 1050000,
  ertiga: 1100000,
  xl6: 1250000,
  grand: 780000,
  'grand vitara': 1450000,
  jimny: 1350000,
  invicto: 2800000,
  i10: 620000,
  'grand i10': 680000,
  i20: 880000,
  venue: 1050000,
  exter: 780000,
  creta: 1450000,
  alcazar: 1850000,
  verna: 1250000,
  aura: 780000,
  tucson: 3200000,
  punch: 750000,
  tiago: 620000,
  tigor: 680000,
  nexon: 1050000,
  altroz: 850000,
  harrier: 1850000,
  safari: 1950000,
  curvv: 1250000,
  city: 1450000,
  amaze: 850000,
  elevate: 1350000,
  'civic': 1800000,
  innova: 2200000,
  'innova crysta': 2200000,
  'innova hycross': 2500000,
  fortuner: 3800000,
  glanza: 840000,
  urban: 1250000,
  'urban cruiser': 1050000,
  hyryder: 1450000,
  camry: 4800000,
  seltos: 1350000,
  sonet: 980000,
  carens: 1250000,
  syros: 1050000,
  carnival: 3800000,
  xuv300: 1050000,
  'xuv 3xo': 1050000,
  xuv400: 1450000,
  xuv700: 1950000,
  thar: 1550000,
  'thar roxx': 1750000,
  scorpio: 1750000,
  'scorpio-n': 1850000,
  'scorpio n': 1850000,
  bolero: 1050000,
  'bolero neo': 1100000,
  hector: 1650000,
  astor: 1250000,
  windsor: 1450000,
  virtus: 1350000,
  taigun: 1350000,
  slavia: 1350000,
  kushaq: 1350000,
  kiger: 750000,
  kwid: 480000,
  triber: 720000,
  magnite: 750000,
  '3 series': 5500000,
  '5 series': 7200000,
  x1: 5200000,
  x3: 7500000,
  'a4': 5000000,
  'q3': 5200000,
  'c-class': 6200000,
  'gla': 5200000,
};

const BODY_GUIDE = {
  Hatchback: 780000,
  Sedan: 1100000,
  SUV: 1450000,
  MUV: 1250000,
  Luxury: 4500000,
  Convertible: 3500000,
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

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function modelKey(name = '') {
  return String(name)
    .toLowerCase()
    .replace(/maruti|suzuki|hyundai|tata|honda|toyota|kia|mahindra|motors|india|ltd|limited/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function guideForModel(brand, model) {
  const key = modelKey(model);
  if (!key) return null;
  if (MODEL_GUIDE[key]) return MODEL_GUIDE[key];
  const hit = Object.keys(MODEL_GUIDE)
    .sort((a, b) => b.length - a.length)
    .find((k) => key.includes(k) || k.includes(key));
  return hit ? MODEL_GUIDE[hit] : null;
}

function variantFactor(variant = '') {
  const v = String(variant).toLowerCase();
  if (/lxi|lxi|lite|base|\be\b|sigma|era|xe|s mt|std|standard/.test(v)) return 0.9;
  if (/zxi\+|zx\+|sx\(o\)|sx \+|prestige|top|abs|optional/.test(v)) return 1.12;
  if (/zxi|zx|zdi|sx|asta|vx|vxi \(o\)|vxi\(o\)|exclusive|sharp/.test(v)) return 1.06;
  if (/vxi|vdi|sportz|sx|mid/.test(v)) return 1;
  return 1;
}

function isStickyBrand(brand = '') {
  return /toyota|honda|maruti|hyundai|kia|mahindra/.test(String(brand).toLowerCase());
}

/** Remaining share of *current* list price — asking-price style, not fire-sale. */
function retainFromCurrentList(age, sticky) {
  const mass = [0.94, 0.88, 0.84, 0.8, 0.77, 0.74, 0.7, 0.66, 0.62, 0.58, 0.54];
  const other = [0.9, 0.82, 0.75, 0.69, 0.63, 0.58, 0.53, 0.48, 0.44, 0.4, 0.36];
  const curve = sticky ? mass : other;
  if (age <= 10) return curve[age];
  const floor = sticky ? 0.28 : 0.18;
  const start = sticky ? 0.54 : 0.36;
  return Math.max(floor, start - (age - 10) * 0.025);
}

function inferredMsrp(input, catalog) {
  if (catalog?.msrp) return catalog.msrp;
  const brand = input.brandName || input.brand || '';
  const model = input.modelName || input.model || '';
  const variant = input.variant || catalog?.variant || '';
  const guided = guideForModel(brand, model);
  if (guided) return roundThousand(guided * variantFactor(variant));

  const bodyType = catalog?.bodyType || input.bodyType || 'Sedan';
  let base = BODY_GUIDE[bodyType] || 980000;
  base *= brandFactor(brand);
  if (catalog?.engineCc) base = Math.max(base, catalog.engineCc * 480);
  return roundThousand(base * variantFactor(variant));
}

function demandScore({ brand, age, kmPerYear, owners }) {
  const sticky = isStickyBrand(brand);
  if (owners >= 4 || age > 14 || kmPerYear > 22000) return 'Low';
  if (sticky && age <= 8 && kmPerYear <= 15000 && owners === 1) return 'High';
  if (sticky && age <= 10) return 'High';
  return 'Medium';
}

function pricePosition(ask, estimate, minPrice, maxPrice) {
  if (!ask || !estimate) return null;
  if (ask < minPrice) return 'great';
  if (ask <= estimate) return 'fair';
  if (ask <= maxPrice) return 'high';
  return 'overpriced';
}

function expectedPriceError(ask, maxPrice) {
  const expected = Number(ask);
  const max = Number(maxPrice);
  if (!(expected > 0) || !(max > 0)) return null;
  if (expected > max) {
    return `Expected price ${roundThousand(expected).toLocaleString('en-IN')} is above the market band (max ₹${max.toLocaleString('en-IN')}). Enter a price within the estimate.`;
  }
  return null;
}

function buildValuationObject(core, extra = {}) {
  return {
    estimatedMinPrice: core.minPrice,
    estimatedMaxPrice: core.maxPrice,
    fairMarketValue: core.estimate,
    demandScore: extra.demandScore || 'Medium',
    priceFactors: extra.priceFactors || {},
    msrp: extra.msrp || null,
    depreciationApplied: extra.depreciationApplied || '',
  };
}

function finalize(core) {
  const position = pricePosition(Number(core.ask || 0), core.estimate, core.minPrice, core.maxPrice);
  return {
    success: true,
    estimate: core.estimate,
    minPrice: core.minPrice,
    maxPrice: core.maxPrice,
    currency: 'INR',
    source: core.source,
    comps: core.comps,
    disclaimer: core.disclaimer,
    breakdown: core.breakdown,
    valuation: buildValuationObject(core, core.valuationExtra || {}),
    position,
    expectedOverBand: Boolean(expectedPriceError(core.ask, core.maxPrice)),
  };
}

function resaleFromGuide(input = {}, catalog = null) {
  const year = Number(input.year || input.registrationYear) || new Date().getFullYear();
  const km = Number(input.kmDriven || input.kilometersDriven || input.mileage) || 45000;
  const owners = Number(input.ownership || input.numberOfOwners || input.ownerCount) || 1;
  const conditionScore = clamp(Number(input.conditionScore) || 7, 1, 10);
  const brand = input.brandName || input.brand || catalog?.brand || '';
  const model = input.modelName || input.model || catalog?.model || '';
  const fuel = input.fuel || input.fuelType || catalog?.fuelType || 'Petrol';
  const transmission = input.transmission || catalog?.transmission || 'Manual';
  const bodyType = input.bodyType || catalog?.bodyType || 'Hatchback';
  const age = Math.max(0, new Date().getFullYear() - year);
  const sticky = isStickyBrand(brand);

  const msrp = inferredMsrp({ ...input, brandName: brand, modelName: model, bodyType }, catalog);
  const retained = retainFromCurrentList(age, sticky);
  let value = msrp * retained;

  const kmPerYear = km / Math.max(age, 1);
  const priceFactors = {
    brandRetention: sticky ? 'Strong resale' : 'Average resale',
  };

  let kmAdj = 0;
  if (kmPerYear < 8000) {
    kmAdj = Math.round(msrp * 0.03);
    value += kmAdj;
    priceFactors.lowMileageBonus = `+₹${kmAdj.toLocaleString('en-IN')}`;
  } else if (kmPerYear < 12000) {
    kmAdj = Math.round(msrp * 0.015);
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

  if (fuel === 'Electric') value *= 1.04;
  if (fuel === 'Hybrid') value *= 1.03;
  if (fuel === 'Diesel' && age > 8) value *= 0.93;
  if (fuel === 'CNG') value *= 0.97;
  if (transmission === 'Automatic' || transmission === 'DCT' || transmission === 'CVT') value *= 1.03;

  const ceiling = roundThousand(msrp * (age === 0 ? 0.96 : 0.9));
  value = Math.min(value, ceiling);

  const estimate = Math.max(75000, roundThousand(value));
  const spread = estimate * (0.06 + (10 - conditionScore) * 0.004);
  const minPrice = Math.max(50000, roundThousand(estimate - spread));
  const maxPrice = Math.min(ceiling, Math.max(minPrice + 20000, roundThousand(estimate + spread)));
  const demand = demandScore({ brand, age, kmPerYear, owners });

  return finalize({
    estimate,
    minPrice,
    maxPrice,
    source: catalog?.msrp ? 'catalog-msrp' : guideForModel(brand, model) ? 'model-guide' : 'catalog-formula',
    disclaimer: 'Indicative 4TYREZZ market range (Spinny / CarDekho style) — not a purchase offer. Final price depends on inspection.',
    ask: Number(input.expectedPrice || input.price) || 0,
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
    valuationExtra: {
      demandScore: demand,
      priceFactors,
      msrp,
      depreciationApplied: `${Math.round((1 - retained) * 100)}%`,
    },
  });
}

function formulaEstimate(input = {}) {
  return resaleFromGuide(input, null);
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
        variant: input.variant,
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
        headers: process.env.VALUATION_API_KEY ? { Authorization: `Bearer ${process.env.VALUATION_API_KEY}` } : {},
      }
    );
    const estimate = Number(data.estimate || data.price || data.value);
    if (!estimate) return null;
    const minPrice = roundThousand(Number(data.minPrice || estimate * 0.92));
    const maxPrice = roundThousand(Number(data.maxPrice || estimate * 1.08));
    return finalize({
      estimate: roundThousand(estimate),
      minPrice,
      maxPrice,
      source: 'external',
      disclaimer: data.disclaimer || 'Indicative estimate only — not a final purchase offer. Final price depends on inspection.',
      ask: Number(input.expectedPrice || input.price) || 0,
      breakdown: { ...(data.breakdown || {}), provider: data.provider || 'external' },
    });
  } catch (err) {
    console.warn('[valuation] external API skipped:', err.message);
    return null;
  }
}

async function fromComparables(input) {
  try {
    const Car = require('../../models/Car');
    const CarModel = require('../../models/CarModel');
    const year = Number(input.year) || new Date().getFullYear();
    const modelName = String(input.modelName || input.model || '').trim();

    const modelIds = [];
    if (input.modelId) modelIds.push(input.modelId);
    if (modelName) {
      const matches = await CarModel.find({ name: new RegExp(`^${escapeRe(modelName)}$`, 'i') })
        .select('_id')
        .lean();
      matches.forEach((m) => modelIds.push(m._id));
    }
    if (!modelIds.length) return null;

    const found = await Car.find({
      status: 'approved',
      price: { $gt: 50000, $lt: 25000000 },
      model: { $in: modelIds },
      year: { $gte: year - 2, $lte: year + 2 },
    })
      .select('price year kmDriven ownership')
      .limit(40)
      .lean();

    if (found.length < 2) return null;

    const prices = found.map((c) => c.price).sort((a, b) => a - b);
    const lo = prices[Math.floor(prices.length * 0.1)];
    const hi = prices[Math.max(0, Math.ceil(prices.length * 0.9) - 1)];
    const trimmed = found.filter((c) => c.price >= lo && c.price <= hi);
    if (trimmed.length < 2) return null;

    const kept = trimmed.map((c) => c.price).sort((a, b) => a - b);
    const mid = kept[Math.floor(kept.length / 2)];
    const avg = kept.reduce((s, p) => s + p, 0) / kept.length;
    let estimate = mid * 0.65 + avg * 0.35;

    const km = Number(input.kmDriven) || 50000;
    const avgKm = trimmed.reduce((s, c) => s + (c.kmDriven || 50000), 0) / trimmed.length;
    if (km > avgKm * 1.2) estimate *= 0.94;
    if (km < avgKm * 0.8) estimate *= 1.05;

    const owners = Number(input.ownership || input.ownerCount) || 1;
    if (owners >= 3) estimate *= 0.9;

    const conditionScore = clamp(Number(input.conditionScore) || 7, 1, 10);
    estimate *= 0.88 + conditionScore * 0.02;
    estimate = Math.max(75000, roundThousand(estimate));

    const guide = inferredMsrp(input, null);
    if (guide && estimate > guide * 1.15) return null;

    const spread = estimate * 0.08;
    return finalize({
      estimate,
      minPrice: Math.max(50000, roundThousand(estimate - spread)),
      maxPrice: roundThousand(estimate + spread),
      source: 'comparables',
      comps: trimmed.length,
      disclaimer: `Indicative estimate from ${trimmed.length} same-model 4tyrezz listings — not a final purchase offer. Final price depends on inspection.`,
      ask: Number(input.expectedPrice || input.price) || 0,
      breakdown: {
        brand: input.brandName || input.brand,
        model: input.modelName || input.model,
        comps: trimmed.length,
        median: roundThousand(mid),
        km,
        owners,
        conditionScore,
      },
      valuationExtra: { demandScore: 'High', msrp: guide },
    });
  } catch (err) {
    console.warn('[valuation] comps skipped:', err.message);
    return null;
  }
}

const Vehicle = require('../../models/Vehicle');

async function lookupCatalogVehicle(input) {
  const brand = String(input.brandName || input.brand || '').trim();
  const model = String(input.modelName || input.model || '').trim();
  if (!brand || !model) return null;
  const filter = {
    brand: new RegExp(`^${escapeRe(brand)}$`, 'i'),
    model: new RegExp(`^${escapeRe(model)}$`, 'i'),
  };
  if (input.variant) {
    filter.variant = new RegExp(escapeRe(String(input.variant)), 'i');
  }
  return Vehicle.findOne(filter).lean();
}

async function calculateResale(input = {}) {
  const catalog = await lookupCatalogVehicle(input);
  return resaleFromGuide(input, catalog);
}

async function estimateValue(input = {}) {
  const external = await fromExternalApi(input);
  if (external) return external;

  const comps = await fromComparables(input);
  if (comps) return comps;

  return calculateResale(input);
}

module.exports = {
  estimateValue,
  formulaEstimate,
  pricePosition,
  calculateResale,
  expectedPriceError,
};
