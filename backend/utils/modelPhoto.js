const Car = require('../models/Car');
const Brand = require('../models/Brand');
const CarModel = require('../models/CarModel');
const Enquiry = require('../models/Enquiry');

function escapeRe(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pairKey(brand, model) {
  return `${String(brand || '').trim().toLowerCase()}|${String(model || '').trim().toLowerCase()}`;
}

async function catalogImages(pairs) {
  const map = new Map();
  const brands = [...new Set(pairs.map((pair) => String(pair.brand || '').trim()).filter(Boolean))];
  const models = [...new Set(pairs.map((pair) => String(pair.model || '').trim()).filter(Boolean))];
  if (!brands.length || !models.length) return map;

  const brandDocs = await Brand.find({
    $or: brands.map((name) => ({ name: new RegExp(`^${escapeRe(name)}$`, 'i') })),
  }).select('name').lean();
  if (!brandDocs.length) return map;

  const brandName = new Map(brandDocs.map((brand) => [String(brand._id), brand.name]));
  const modelDocs = await CarModel.find({
    brand: { $in: brandDocs.map((brand) => brand._id) },
    $or: models.map((name) => ({ name: new RegExp(`^${escapeRe(name)}$`, 'i') })),
  }).select('name brand').lean();
  if (!modelDocs.length) return map;

  const cars = await Car.find({
    model: { $in: modelDocs.map((model) => model._id) },
    'images.0': { $exists: true },
  }).select('images year model').lean();

  const modelMeta = new Map(modelDocs.map((model) => [String(model._id), model]));
  cars.forEach((car) => {
    const meta = modelMeta.get(String(car.model));
    const image = (car.images || []).find(Boolean);
    if (!meta || !image) return;
    const key = pairKey(brandName.get(String(meta.brand)), meta.name);
    const list = map.get(key) || [];
    list.push({ year: Number(car.year) || 0, image });
    map.set(key, list);
  });
  return map;
}

function pickCatalog(map, brand, model, year) {
  const list = map.get(pairKey(brand, model));
  if (!list?.length) return '';
  const target = Number(year) || 0;
  const best = [...list].sort((a, b) => Math.abs(a.year - target) - Math.abs(b.year - target))[0];
  return best?.image || '';
}

async function photosByValuation(userId, valuationIds) {
  const map = new Map();
  if (!valuationIds.length) return map;
  const rows = await Enquiry.find({
    user: userId,
    valuationId: { $in: valuationIds },
    'photos.0': { $exists: true },
  }).select('valuationId photos').lean();
  rows.forEach((row) => {
    const photo = (row.photos || []).find(Boolean);
    if (photo) map.set(String(row.valuationId), photo);
  });
  return map;
}

module.exports = { catalogImages, pickCatalog, photosByValuation };
