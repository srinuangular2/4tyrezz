const Vehicle = require('../models/Vehicle');
const { ensureVehicleCatalog, seedVehiclesFromRemote } = require('../scripts/seedVehiclesFromRemote');

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

async function listBrands() {
  const brands = (await Vehicle.distinct('brand')).filter(Boolean);
  brands.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return brands;
}

async function listModels(brand) {
  const filter = brandFilter(brand);
  if (!filter) return [];
  const models = (await Vehicle.distinct('model', filter)).filter(Boolean);
  models.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return models;
}

async function listFuelTransmissions(brand, model) {
  const filter = { ...brandFilter(brand), ...modelFilter(model) };
  if (!filter.brand || !filter.model) {
    return { fuelTypes: [], transmissions: [], years: [], bodyTypes: [] };
  }
  const [fuelTypes, transmissions, years, bodyTypes] = await Promise.all([
    Vehicle.distinct('fuelType', filter),
    Vehicle.distinct('transmission', filter),
    Vehicle.distinct('years', filter),
    Vehicle.distinct('bodyType', filter),
  ]);
  const sort = (arr) =>
    arr.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'en', { sensitivity: 'base' }));
  return {
    fuelTypes: sort(fuelTypes),
    transmissions: sort(transmissions),
    years: [...new Set(years.filter((y) => Number(y)))].sort((a, b) => b - a),
    bodyTypes: sort(bodyTypes),
  };
}

async function listVariants({ brand, model, fuelType, transmission, search, year }) {
  const filter = { ...brandFilter(brand), ...modelFilter(model) };
  if (!filter.brand || !filter.model) return [];
  if (fuelType) filter.fuelType = new RegExp(`^${escapeRegex(fuelType)}$`, 'i');
  if (transmission) filter.transmission = new RegExp(`^${escapeRegex(transmission)}$`, 'i');
  if (year) filter.years = Number(year);
  if (search) filter.variant = new RegExp(escapeRegex(search), 'i');
  filter.variant = filter.variant || { $nin: ['', null] };
  let docs = await Vehicle.find(filter)
    .select('brand model variant fuelType transmission bodyType engineCc msrp years')
    .sort({ variant: 1 })
    .lean();
  if (year && docs.length === 0) {
    const unfiltered = { ...filter };
    delete unfiltered.years;
    docs = await Vehicle.find(unfiltered)
      .select('brand model variant fuelType transmission bodyType engineCc msrp years')
      .sort({ variant: 1 })
      .lean();
  }
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
      years: d.years || [],
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
  listModels,
  listFuelTransmissions,
  listVariants,
};
