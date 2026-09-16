const Vehicle = require('../models/Vehicle');
const Brand = require('../models/Brand');
const { ensureVehicleCatalog, seedVehiclesFromRemote } = require('../scripts/seedVehiclesFromRemote');
const { POPULAR_BRANDS } = require('../data/brandMarket');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const brandFilter = (brand) => {
  const name = String(brand || '').trim();
  if (!name) return null;
  return { brand: new RegExp(`^${escapeRegex(name)}$`, 'i') };
};

const modelFilter = (model) => {
  const name = String(model || '').trim();
  if (!name) return null;
  return { model: new RegExp(`^${escapeRegex(name)}$`, 'i') };
};

const currentCatalogYear = () => new Date().getFullYear();

function capCatalogYears(years) {
  const now = currentCatalogYear();
  return [...new Set((years || []).map(Number).filter((y) => y >= 1980 && y <= now))].sort((a, b) => b - a);
}

function yearConstraint(year) {
  const y = Number(year);
  if (!y) return null;
  return { years: y };
}

async function listBrands() {
  const names = (await Vehicle.distinct('brand')).filter(Boolean);
  const docs = await Brand.find({ name: { $in: names } }).select('name logo isPopular').lean();
  const byName = new Map(docs.map((d) => [d.name, d]));
  const popularRank = new Map(POPULAR_BRANDS.map((n, i) => [n, i]));
  return names
    .map((name) => {
      const doc = byName.get(name);
      return {
        name,
        logo: doc?.logo || '',
        isPopular: Boolean(doc?.isPopular) || popularRank.has(name),
      };
    })
    .sort((a, b) => {
      const pa = popularRank.has(a.name) ? popularRank.get(a.name) : 100;
      const pb = popularRank.has(b.name) ? popularRank.get(b.name) : 100;
      if (pa !== pb) return pa - pb;
      if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    });
}

async function listYears(brand) {
  const filter = brandFilter(brand);
  if (!filter) return [];
  const years = await Vehicle.distinct('years', filter);
  return capCatalogYears(years);
}

async function listModels(brand, year) {
  const filter = brandFilter(brand);
  if (!filter) return [];
  const yc = yearConstraint(year);
  if (yc) Object.assign(filter, yc);
  const models = (await Vehicle.distinct('model', filter)).filter(Boolean);
  models.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return models;
}

async function listFuelTransmissions(brand, model, year) {
  const filter = { ...brandFilter(brand), ...modelFilter(model) };
  if (!filter.brand || !filter.model) {
    return { fuelTypes: [], transmissions: [], years: [], bodyTypes: [] };
  }
  const specFilter = { ...filter };
  const yc = yearConstraint(year);
  if (yc) Object.assign(specFilter, yc);
  const [fuelTypes, transmissions, years, bodyTypes] = await Promise.all([
    Vehicle.distinct('fuelType', specFilter),
    Vehicle.distinct('transmission', specFilter),
    Vehicle.distinct('years', filter),
    Vehicle.distinct('bodyType', specFilter),
  ]);
  const sort = (arr) =>
    arr.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'en', { sensitivity: 'base' }));
  return {
    fuelTypes: sort(fuelTypes),
    transmissions: sort(transmissions),
    years: capCatalogYears(years),
    bodyTypes: sort(bodyTypes),
  };
}

async function listVariants({ brand, model, fuelType, transmission, search, year }) {
  const filter = { ...brandFilter(brand), ...modelFilter(model) };
  if (!filter.brand || !filter.model) return [];
  if (fuelType) filter.fuelType = new RegExp(`^${escapeRegex(fuelType)}$`, 'i');
  if (transmission) filter.transmission = new RegExp(`^${escapeRegex(transmission)}$`, 'i');
  const yc = yearConstraint(year);
  if (yc) Object.assign(filter, yc);
  if (search) filter.variant = new RegExp(escapeRegex(search), 'i');
  filter.variant = filter.variant || { $nin: ['', null] };
  const docs = await Vehicle.find(filter)
    .select('brand model variant fuelType transmission bodyType engineCc msrp years')
    .sort({ variant: 1 })
    .lean();
  const seen = new Set();
  const unique = [];
  for (const d of docs) {
    const key = `${d.variant}::${d.fuelType}::${d.transmission}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      _id: d._id,
      name: d.variant,
      variant: d.variant,
      brand: d.brand,
      model: d.model,
      fuelType: d.fuelType,
      transmission: d.transmission,
      bodyType: d.bodyType,
      engineCc: d.engineCc,
      msrp: d.msrp,
      years: capCatalogYears(d.years || []),
    });
  }
  return unique;
}

async function ingestCatalog({ force = false } = {}) {
  return seedVehiclesFromRemote({ force });
}

module.exports = {
  ensureVehicleCatalog,
  ingestCatalog,
  listBrands,
  listYears,
  listModels,
  listFuelTransmissions,
  listVariants,
};
