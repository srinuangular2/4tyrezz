const Vehicle = require('../models/Vehicle');
const Brand = require('../models/Brand');
const { ensureVehicleCatalog, seedVehiclesFromRemote } = require('../scripts/seedVehiclesFromRemote');
const { POPULAR_BRANDS } = require('../data/brandMarket');
const { parentModelName } = require('../data/marketVariants');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const catalogOnly = { source: { $nin: ['market-trims'] } };

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

function toVariantDto(d) {
  return {
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
  };
}

function mergeVariants(...lists) {
  const seen = new Set();
  const unique = [];
  lists.flat().forEach((d) => {
    const name = d.variant || d.name;
    if (!name) return;
    const key = `${String(name).toLowerCase()}::${String(d.fuelType || '').toLowerCase()}::${String(d.transmission || '').toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push({ ...d, name, variant: name });
  });
  unique.sort((a, b) => String(a.variant).localeCompare(String(b.variant), 'en', { sensitivity: 'base' }));
  return unique;
}

async function queryDbVariants({ brand, model, fuelType, transmission, search, year }) {
  const filter = { ...catalogOnly, ...brandFilter(brand), ...modelFilter(model) };
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
  return docs.filter((d) => d.variant).map(toVariantDto);
}

async function listBrands() {
  const names = (await Vehicle.distinct('brand', catalogOnly)).filter(Boolean);
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
  const filter = { ...catalogOnly, ...brandFilter(brand) };
  if (!filter.brand) return [];
  const years = await Vehicle.distinct('years', filter);
  return capCatalogYears(years);
}

async function listModels(brand, year) {
  const filter = { ...catalogOnly, ...brandFilter(brand) };
  if (!filter.brand) return [];
  const yc = yearConstraint(year);
  if (yc) Object.assign(filter, yc);
  const models = (await Vehicle.distinct('model', filter)).filter(Boolean);
  models.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return models;
}

async function listFuelTransmissions(brand, model, year) {
  const filter = { ...catalogOnly, ...brandFilter(brand), ...modelFilter(model) };
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
  let fuels = sort(fuelTypes);
  let trans = sort(transmissions);
  let bodies = sort(bodyTypes);
  if (!fuels.length) {
    const parent = parentModelName(model);
    if (parent && parent.toLowerCase() !== String(model).toLowerCase()) {
      const parentData = await listFuelTransmissions(brand, parent, year);
      fuels = parentData.fuelTypes;
      trans = parentData.transmissions;
      bodies = parentData.bodyTypes;
    }
  }
  return {
    fuelTypes: fuels,
    transmissions: trans,
    years: capCatalogYears(years),
    bodyTypes: bodies,
  };
}

async function listVariants({ brand, model, fuelType, transmission, search, year }) {
  const args = { brand, model, fuelType, transmission, search, year };
  let rows = await queryDbVariants(args);
  if (!rows.length && year) {
    rows = await queryDbVariants({ ...args, year: undefined });
  }
  if (!rows.length) {
    const parent = parentModelName(model);
    if (parent && parent.toLowerCase() !== String(model).toLowerCase()) {
      rows = await queryDbVariants({ ...args, model: parent });
      if (!rows.length && year) {
        rows = await queryDbVariants({ ...args, model: parent, year: undefined });
      }
    }
  }
  return mergeVariants(rows);
}

async function ingestCatalog({ force = false } = {}) {
  return seedVehiclesFromRemote({ force });
}

async function bootCatalog() {
  await ensureVehicleCatalog();
  await Vehicle.deleteMany({ source: 'market-trims' });
}

module.exports = {
  ensureVehicleCatalog: bootCatalog,
  ingestCatalog,
  listBrands,
  listYears,
  listModels,
  listFuelTransmissions,
  listVariants,
};
