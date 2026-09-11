require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const connectDB = require('../config/db');
const Vehicle = require('../models/Vehicle');
const Brand = require('../models/Brand');
const CarModel = require('../models/CarModel');
const slugify = require('slugify');

const CACHE_DIR = path.join(__dirname, '..', '.cache');

const CATALOGUE_URLS = [
  process.env.VEHICLE_CATALOG_URL,
  'https://variantwise.com/data/catalogue.json',
  'https://huggingface.co/datasets/variantwise/indian-cars-variants/resolve/main/data/catalogue.json',
  'https://raw.githubusercontent.com/kanishkamendevell/variantwise-open-data/main/data/catalogue.json',
].filter(Boolean);

const HISTORICAL_URLS = [
  'https://raw.githubusercontent.com/deepakssn/indiancars/master/indiancars.json',
  'https://raw.githubusercontent.com/Deadpool2000/Indian-Automotive-Data-Hub-API/main/data.json',
];

const toSlug = (value) =>
  slugify(String(value || '').trim(), { lower: true, strict: true }) || 'item';

function titleBrand(raw = '') {
  const trimmed = String(raw).trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'maruti' || lower === 'maruti udyog') return 'Maruti Suzuki';
  if (lower === 'benz' || lower === 'mercedes' || lower === 'mercedes benz') return 'Mercedes-Benz';
  if (lower === 'land') return 'Land Rover';
  if (lower === 'opelcorsa') return 'Opel';
  if (lower === 'vw') return 'Volkswagen';
  if (lower === 'mg' || lower === 'morris garages') return 'MG';
  if (lower === 'byd') return 'BYD';
  if (lower === 'bmw') return 'BMW';
  if (lower === 'ashok leyland') return 'Ashok Leyland';
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bAnd\b/, '&');
}

function fuelTypeFrom(raw = '') {
  const v = String(raw).toLowerCase();
  if (!v) return '';
  if (v.includes('electric') || v === 'ev' || v.includes('battery')) return 'Electric';
  if (v.includes('hybrid')) return 'Hybrid';
  if (v.includes('cng')) return 'CNG';
  if (v.includes('lpg')) return 'LPG';
  if (v.includes('diesel')) return 'Diesel';
  if (v.includes('petrol') || v.includes('gasoline')) return 'Petrol';
  return String(raw).replace(/\b\w/g, (c) => c.toUpperCase());
}

function transmissionFrom(raw = '') {
  const v = String(raw).toUpperCase();
  if (!v) return '';
  if (v.includes('DCT')) return 'DCT';
  if (v.includes('CVT') || v.includes('IVT')) return 'CVT';
  if (v.includes('AMT')) return 'AMT';
  if (/\bEV\b/.test(v) || v.includes('1EV')) return 'Automatic';
  if (v.includes('MT') || v.includes('MANUAL')) return 'Manual';
  if (v.includes('AT') || v.includes('AUTO')) return 'Automatic';
  return String(raw);
}

function bodyTypeFrom(raw = '') {
  const v = String(raw).toLowerCase();
  if (!v) return '';
  if (v.includes('hatch')) return 'Hatchback';
  if (v.includes('sedan') || v.includes('saloon')) return 'Sedan';
  if (v.includes('mpv') || v.includes('muv') || v.includes('minivan')) return 'MUV';
  if (v.includes('pickup') || v.includes('pick-up') || v.includes('pik')) return 'Pickup';
  if (v.includes('suv') || v.includes('crossover') || v.includes('coupe')) return 'SUV';
  return String(raw).replace(/\b\w/g, (c) => c.toUpperCase());
}

function yearsRange(start, end) {
  const to = Number(end) || new Date().getFullYear();
  let from = Number(start);
  if (!from || from < 1980 || from > to) from = Math.max(1995, to - 18);
  const years = [];
  for (let y = to; y >= from; y -= 1) years.push(y);
  return years;
}

async function downloadJson(urls, cacheName) {
  const cachePath = path.join(CACHE_DIR, cacheName);
  let lastErr;
  for (const url of urls) {
    try {
      const { data } = await axios.get(url, {
        timeout: 45000,
        headers: { Accept: 'application/json', 'User-Agent': '4tyrezz-catalog/1.0' },
        maxContentLength: 20 * 1024 * 1024,
        validateStatus: (s) => s === 200,
      });
      if (!data || (typeof data === 'object' && !Object.keys(data).length)) continue;
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cachePath, typeof data === 'string' ? data : JSON.stringify(data));
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      lastErr = err;
    }
  }
  if (fs.existsSync(cachePath)) {
    try {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch {
      /* ignore corrupt cache */
    }
  }
  if (lastErr) throw lastErr;
  throw new Error(`No source responded for ${cacheName}`);
}

function parseVariantWise(payload) {
  const models = payload?.models;
  if (!Array.isArray(models) || !models.length) return [];
  const dataYear = Number(String(payload.dataAsOf || '').slice(0, 4)) || new Date().getFullYear();
  const rows = [];
  for (const model of models) {
    const brand = titleBrand(model.brand);
    const modelName = String(model.name || '').trim();
    if (!brand || !modelName) continue;
    const bodyType = bodyTypeFrom(model.bodyStyle || model.bodyType);
    const years = yearsRange(model.launched || model.yearStart || model.introduced, dataYear);
    const engines = new Map((model.engines || []).map((e) => [e.id, e]));
    const trims = new Map((model.trims || []).map((t) => [t.id, t]));
    const variants = Array.isArray(model.variants) ? model.variants : [];
    if (!variants.length) {
      rows.push({
        brand,
        model: modelName,
        bodyType,
        fuelType: '',
        transmission: '',
        variant: '',
        engineCc: undefined,
        years,
        source: 'variantwise',
        sourceKey: `variantwise::${model.id}::base`,
      });
      continue;
    }
    for (const variant of variants) {
      const engine = engines.get(variant.engineId) || {};
      const trim = trims.get(variant.trimId) || {};
      const fuelType = fuelTypeFrom(engine.fuel);
      const transmission = transmissionFrom(variant.transmission);
      const trimName = String(trim.name || '').trim();
      const drive = /4x4|awd|4wd/i.test(String(engine.driveType || variant.id || ''))
        ? engine.driveType || '4WD'
        : '';
      const variantName = [trimName || variant.id, drive].filter(Boolean).join(' ').trim();
      rows.push({
        brand,
        model: modelName,
        bodyType,
        fuelType,
        transmission,
        variant: variantName,
        engineCc: engine.displacementCc,
        msrp: Number(variant.price) ? Math.round(Number(variant.price) * 100000) : undefined,
        years,
        source: 'variantwise',
        sourceKey: `variantwise::${model.id}::${variant.id}`,
      });
    }
  }
  return rows;
}

function parseIndianCarsList(payload) {
  const cars = payload?.cars;
  if (!Array.isArray(cars) || !cars.length) return [];
  const years = yearsRange(1998, new Date().getFullYear());
  return cars
    .map((row) => {
      const brand = titleBrand(row.brand);
      const model = String(row.model || '').trim();
      if (!brand || !model) return null;
      return {
        brand,
        model,
        bodyType: '',
        fuelType: '',
        transmission: '',
        variant: '',
        years,
        source: 'indiancars',
        sourceKey: `indiancars::${toSlug(brand)}::${toSlug(model)}`,
      };
    })
    .filter(Boolean);
}

function parseDeadpoolHub(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  const entries = Object.values(payload);
  if (!entries.length || typeof entries[0] !== 'object') return [];
  if (!('brand name' in entries[0] || 'brandName' in entries[0] || entries[0].brand)) return [];
  const years = yearsRange(2005, new Date().getFullYear());
  const rows = [];
  for (const row of entries) {
    const brand = titleBrand(row['brand name'] || row.brandName || row.brand);
    const model = String(row['model name'] || row.modelName || row.model || '').trim();
    if (!brand || !model) continue;
    const bodyType = bodyTypeFrom(row['body type'] || row.bodyType || row['vehicle type']);
    const variants = row.variants && typeof row.variants === 'object' ? Object.values(row.variants) : [];
    if (!variants.length) {
      rows.push({
        brand,
        model,
        bodyType,
        fuelType: '',
        transmission: '',
        variant: '',
        years,
        source: 'indian-automotive-hub',
        sourceKey: `hub::${toSlug(brand)}::${toSlug(model)}`,
      });
      continue;
    }
    for (const variant of variants) {
      const name = String(variant.name || variant['car variant'] || '').trim();
      rows.push({
        brand,
        model,
        bodyType: bodyTypeFrom(variant['vehicle type'] || bodyType),
        fuelType: fuelTypeFrom(variant['fuel type'] || variant.fuel),
        transmission: transmissionFrom(variant.transmission || variant.name),
        variant: name,
        years,
        source: 'indian-automotive-hub',
        sourceKey: `hub::${toSlug(brand)}::${toSlug(model)}::${toSlug(name)}`,
      });
    }
  }
  return rows;
}

function parseRemote(payload) {
  const a = parseVariantWise(payload);
  if (a.length) return a;
  const b = parseIndianCarsList(payload);
  if (b.length) return b;
  return parseDeadpoolHub(payload);
}

async function upsertVehicles(rows) {
  const seen = new Map();
  for (const row of rows) {
    if (!row.brand || !row.model || !row.sourceKey) continue;
    if (!seen.has(row.sourceKey)) seen.set(row.sourceKey, row);
  }
  const unique = [...seen.values()];
  const ops = unique.map((row) => ({
    updateOne: {
      filter: { sourceKey: row.sourceKey },
      update: { $set: row },
      upsert: true,
    },
  }));
  const chunk = 500;
  for (let i = 0; i < ops.length; i += chunk) {
    await Vehicle.bulkWrite(ops.slice(i, i + chunk), { ordered: false });
  }

  const brandNames = [...new Set(unique.map((r) => r.brand))];
  await Brand.bulkWrite(
    brandNames.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name, slug: toSlug(name), logo: '', isPopular: false } },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const brandDocs = await Brand.find({ name: { $in: brandNames } }).lean();
  const brandByName = new Map(brandDocs.map((b) => [b.name, b]));
  const modelOps = [];
  const modelSeen = new Set();
  for (const row of unique) {
    const key = `${row.brand}::${toSlug(row.model)}`;
    if (modelSeen.has(key)) continue;
    modelSeen.add(key);
    const brandDoc = brandByName.get(row.brand);
    if (!brandDoc) continue;
    modelOps.push({
      updateOne: {
        filter: { brand: brandDoc._id, slug: toSlug(row.model) },
        update: {
          $setOnInsert: { name: row.model, slug: toSlug(row.model), brand: brandDoc._id },
          $set: row.bodyType ? { bodyType: row.bodyType } : {},
        },
        upsert: true,
      },
    });
  }
  if (modelOps.length) await CarModel.bulkWrite(modelOps, { ordered: false });

  const top = await Vehicle.aggregate([
    { $group: { _id: '$brand', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 8 },
  ]);
  await Brand.updateMany({}, { $set: { isPopular: false } });
  if (top.length) {
    await Brand.updateMany({ name: { $in: top.map((t) => t._id) } }, { $set: { isPopular: true } });
  }

  return {
    upserted: unique.length,
    brands: await Vehicle.distinct('brand').then((b) => b.length),
    models: (await Vehicle.aggregate([{ $group: { _id: { brand: '$brand', model: '$model' } } }])).length,
    variants: await Vehicle.countDocuments({ variant: { $nin: ['', null] } }),
  };
}

async function seedVehiclesFromRemote({ force = false } = {}) {
  const existing = await Vehicle.countDocuments();
  if (existing > 0 && !force) {
    return { skipped: true, existing };
  }

  const rows = [];
  try {
    rows.push(...parseRemote(await downloadJson(CATALOGUE_URLS, 'catalogue.json')));
  } catch (err) {
    console.warn('Catalogue fetch failed:', err.message);
  }
  try {
    rows.push(...parseRemote(await downloadJson(HISTORICAL_URLS, 'indiancars.json')));
  } catch (err) {
    console.warn('Historical list fetch failed:', err.message);
  }
  if (!rows.length) {
    throw new Error('Could not load any Indian vehicle catalogue from remote sources');
  }
  const stats = await upsertVehicles(rows);
  console.log(
    `Vehicles seeded: ${stats.brands} brands, ${stats.models} models, ${stats.variants} variants (${stats.upserted} rows)`
  );
  return stats;
}

async function ensureVehicleCatalog() {
  try {
    await seedVehiclesFromRemote({ force: process.env.VEHICLE_CATALOG_FORCE === 'true' });
  } catch (err) {
    console.error('Vehicle catalog bootstrap skipped:', err.message);
  }
}

if (require.main === module) {
  (async () => {
    await connectDB();
    try {
      const stats = await seedVehiclesFromRemote({ force: true });
      console.log(stats);
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = { seedVehiclesFromRemote, ensureVehicleCatalog };
