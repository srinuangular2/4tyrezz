const Car = require('../models/Car');
const Brand = require('../models/Brand');
const CarModel = require('../models/CarModel');
const City = require('../models/City');
const { publicListingFilter } = require('../utils/listingStatus');
const { autocompleteLocations, nominatimSearch } = require('../services/locationService');
const Location = require('../models/Location');

const cache = new Map();
const CACHE_TTL_MS = 30 * 1000;
const queryLog = [];

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size > 200) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, { at: Date.now(), value });
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isOid(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ''));
}

function recordQuery(q) {
  const term = String(q || '').trim().slice(0, 80);
  if (term.length < 2) return;
  queryLog.push({ q: term, at: Date.now() });
  if (queryLog.length > 400) queryLog.splice(0, queryLog.length - 400);
}

async function resolveCity(raw) {
  if (!raw) return { id: null, name: '' };
  if (isOid(raw)) {
    const doc = await City.findById(raw).select('name').lean();
    return { id: raw, name: doc?.name || '' };
  }
  const cities = await City.find({}).select('_id name slug').lean();
  const needle = String(raw).toLowerCase().trim();
  const exact = cities.find((c) => String(c.name).toLowerCase() === needle || String(c.slug).toLowerCase() === needle);
  if (exact) return { id: exact._id, name: exact.name };
  const partial = cities
    .filter((c) => needle.includes(String(c.name).toLowerCase()) || String(c.name).toLowerCase().includes(needle))
    .sort((a, b) => String(b.name).length - String(a.name).length)[0];
  return partial ? { id: partial._id, name: partial.name } : { id: null, name: '' };
}

function liveMatch(cityId) {
  const filter = { ...publicListingFilter() };
  if (cityId) filter.city = cityId;
  return filter;
}

function modelLookups() {
  return [
    { $lookup: { from: Brand.collection.collectionName, localField: '_id.brand', foreignField: '_id', as: 'brand' } },
    { $lookup: { from: CarModel.collection.collectionName, localField: '_id.model', foreignField: '_id', as: 'model' } },
    { $unwind: '$brand' },
    { $unwind: '$model' },
    {
      $project: {
        _id: 0,
        brand: '$brand.name',
        brandSlug: '$brand.slug',
        model: '$model.name',
        modelSlug: '$model.slug',
        logo: '$brand.logo',
        count: 1,
      },
    },
  ];
}

async function emptyState(cityId, cityName) {
  const match = liveMatch(cityId);
  const [brandGroups, modelGroups, comboGroups, underTenLakh, total, popularAreas] = await Promise.all([
    Car.aggregate([
      { $match: match },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: Brand.collection.collectionName, localField: '_id', foreignField: '_id', as: 'brand' } },
      { $unwind: '$brand' },
      { $project: { _id: 0, id: '$brand._id', name: '$brand.name', slug: '$brand.slug', logo: '$brand.logo', count: 1 } },
    ]),
    Car.aggregate([
      { $match: match },
      { $group: { _id: { brand: '$brand', model: '$model' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      ...modelLookups(),
    ]),
    Car.aggregate([
      { $match: match },
      { $group: { _id: { fuel: '$fuel', bodyType: '$bodyType', transmission: '$transmission' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Car.aggregate([
      { $match: { ...match, price: { $lte: 1000000 } } },
      { $group: { _id: { bodyType: '$bodyType', transmission: '$transmission' }, count: { $sum: 1 } } },
      { $match: { count: { $gte: 1 }, '_id.bodyType': { $nin: [null, ''] } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]),
    Car.countDocuments(match),
    cityName
      ? Location.find({ type: 'area', cityName: new RegExp(`^${escapeRegex(cityName)}$`, 'i') }).sort({ listingCount: -1, name: 1 }).limit(8).lean()
      : Location.find({ type: 'area' }).sort({ listingCount: -1, name: 1 }).limit(8).lean(),
  ]);

  const logged = Object.entries(
    queryLog.reduce((acc, row) => {
      const key = row.q.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([q, count]) => ({ label: q, q, count }));

  const trending = [
    ...logged,
    ...modelGroups.slice(0, 4).map((m) => ({
      label: cityName ? `${m.brand} ${m.model} in ${cityName}` : `${m.brand} ${m.model}`,
      brand: m.brand,
      model: m.model,
      city: cityName || undefined,
      count: m.count,
    })),
    ...comboGroups
      .filter((c) => c._id.fuel && c._id.bodyType)
      .slice(0, 4)
      .map((c) => ({
        label: [c._id.transmission, c._id.bodyType, c._id.fuel].filter(Boolean).join(' '),
        fuel: c._id.fuel,
        bodyType: c._id.bodyType,
        transmission: c._id.transmission,
        count: c.count,
      })),
    ...underTenLakh.map((c) => ({
      label: `${[c._id.transmission, c._id.bodyType].filter(Boolean).join(' ')} under ₹10 Lakhs`,
      bodyType: c._id.bodyType,
      transmission: c._id.transmission,
      maxPrice: 1000000,
      count: c.count,
    })),
  ].filter((row, i, all) => row.label && all.findIndex((x) => x.label === row.label) === i);

  return {
    popularBrands: brandGroups,
    popularModels: modelGroups,
    popularAreas: (popularAreas || []).map((d) => ({
      type: 'area',
      name: d.name,
      area: d.name,
      city: d.cityName,
      state: d.stateName,
      count: d.listingCount || 0,
      label: [d.name, d.cityName, d.stateName].filter(Boolean).join(', '),
    })),
    trending,
    total,
    cityName,
  };
}

async function typedState(q, cityId) {
  recordQuery(q);
  const rx = new RegExp(escapeRegex(q), 'i');
  const [brandDocs, modelDocs] = await Promise.all([
    Brand.find({ name: rx }).select('_id name slug logo').limit(20).lean(),
    CarModel.find({ name: rx }).populate('brand', 'name slug logo').limit(20).lean(),
  ]);
  const brandIds = brandDocs.map((b) => b._id);
  const modelIds = modelDocs.map((m) => m._id);
  const or = [{ title: rx }, { variant: rx }, { fuel: rx }, { bodyType: rx }, { transmission: rx }];
  if (brandIds.length) or.push({ brand: { $in: brandIds } });
  if (modelIds.length) or.push({ model: { $in: modelIds } });

  const match = { ...liveMatch(null), $or: or };
  const carSelect = 'title images price year kmDriven fuel variant city brand model';
  const carPopulate = [
    { path: 'brand', select: 'name slug logo' },
    { path: 'model', select: 'name slug' },
    { path: 'city', select: 'name' },
  ];

  const [models, localCars, total, enums] = await Promise.all([
    Car.aggregate([
      { $match: match },
      { $group: { _id: { brand: '$brand', model: '$model' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      ...modelLookups(),
    ]),
    cityId
      ? Car.find({ ...match, city: cityId }).populate(carPopulate).sort('-views -createdAt').limit(3).select(carSelect).lean()
      : Promise.resolve([]),
    Car.countDocuments(match),
    Car.aggregate([
      { $match: liveMatch(null) },
      {
        $group: {
          _id: null,
          fuels: { $addToSet: '$fuel' },
          bodyTypes: { $addToSet: '$bodyType' },
          transmissions: { $addToSet: '$transmission' },
        },
      },
    ]),
  ]);

  let cars = localCars;
  if (cars.length < 3) {
    const extra = await Car.find({ ...match, _id: { $nin: cars.map((c) => c._id) } })
      .populate(carPopulate)
      .sort('-views -createdAt')
      .limit(3 - cars.length)
      .select(carSelect)
      .lean();
    cars = cars.concat(extra);
  }

  const tokens = q.toLowerCase().split(/[\s,+]+/).filter(Boolean);
  const dims = enums[0] || { fuels: [], bodyTypes: [], transmissions: [] };
  const intent = {};
  (dims.fuels || []).forEach((v) => {
    if (v && tokens.some((t) => String(v).toLowerCase().includes(t) || t.includes(String(v).toLowerCase()))) intent.fuel = v;
  });
  (dims.bodyTypes || []).forEach((v) => {
    if (v && tokens.some((t) => String(v).toLowerCase().includes(t) || t.includes(String(v).toLowerCase()))) intent.bodyType = v;
  });
  (dims.transmissions || []).forEach((v) => {
    if (v && tokens.some((t) => String(v).toLowerCase().includes(t) || t.includes(String(v).toLowerCase()))) intent.transmission = v;
  });
  const intents = Object.keys(intent).length
    ? [{ label: [intent.transmission, intent.bodyType, intent.fuel].filter(Boolean).join(' + '), ...intent }]
    : [];

  return {
    models,
    cars: cars.map((c) => ({
      id: c._id,
      title: c.title,
      thumbnail: c.images?.[0] || '',
      price: c.price,
      year: c.year,
      kmDriven: c.kmDriven,
      fuel: c.fuel,
      variant: c.variant,
      city: c.city?.name || '',
      brand: c.brand?.name || '',
      model: c.model?.name || '',
    })),
    intents,
    total,
    locations: await autocompleteLocations(q, ''),
  };
}

exports.autocomplete = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    const cityRef = await resolveCity(req.query.city || req.query.location);
    const key = `${q.toLowerCase()}|${cityRef.id || ''}|${req.query.area || ''}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ ...cached, cached: true });

    const empty = await emptyState(cityRef.id, cityRef.name);
    if (q.length < 2) {
      const payload = { success: true, q, ...empty, models: [], cars: [], intents: [], locations: empty.popularAreas || [] };
      cacheSet(key, payload);
      return res.json(payload);
    }

    const typed = await typedState(q, cityRef.id);
    const [dbLoc, geoLoc] = await Promise.all([
      autocompleteLocations(q, cityRef.name),
      nominatimSearch(q, { city: cityRef.name, limit: 5 }),
    ]);
    const seen = new Set();
    typed.locations = [...dbLoc, ...geoLoc.map((g) => ({
      type: g.area ? 'area' : 'city',
      name: g.area || g.city,
      area: g.area,
      city: g.city,
      state: g.state,
      count: 0,
      label: [g.area, g.city, g.state].filter(Boolean).join(', '),
    }))].filter((row) => {
      const key = `${row.area}|${row.city}|${row.state}`.toLowerCase();
      if (!row.label || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
    const payload = { success: true, q, ...empty, ...typed };
    cacheSet(key, payload);
    res.json(payload);
  } catch (err) {
    console.error('autocomplete error:', err);
    res.status(500).json({ message: 'Could not search' });
  }
};
