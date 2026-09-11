const axios = require('axios');
const slugify = require('slugify');
const Car = require('../models/Car');
const City = require('../models/City');
const Location = require('../models/Location');
const { publicListingFilter } = require('../utils/listingStatus');

const UA = '4TYREZZ-Location/1.0 (https://4tyrezz.com)';
const cache = new Map();

function toSlug(value) {
  return slugify(String(value || '').trim(), { lower: true, strict: true }) || 'na';
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function point(lon, lat) {
  const lng = Number(lon);
  const latitude = Number(lat);
  if (!Number.isFinite(lng) || !Number.isFinite(latitude)) return undefined;
  return { type: 'Point', coordinates: [lng, latitude] };
}

function parseLocationPayload(raw = {}) {
  let nested = raw.location;
  if (typeof nested === 'string') {
    try {
      nested = JSON.parse(nested);
    } catch {
      nested = {};
    }
  }
  nested = nested && typeof nested === 'object' ? nested : {};
  const coords = nested.coordinates?.coordinates || nested.coordinates;
  const lon = raw.longitude || raw.lng || nested.lng || nested.longitude || (Array.isArray(coords) ? coords[0] : undefined);
  const lat = raw.latitude || raw.lat || nested.lat || nested.latitude || (Array.isArray(coords) ? coords[1] : undefined);
  return {
    state: titleCase(raw.locationState || raw.state || nested.state || ''),
    city: titleCase(raw.locationCity || raw.cityName || nested.city || (!/^[a-fA-F0-9]{24}$/.test(String(raw.city || '')) ? raw.city : '') || ''),
    area: titleCase(raw.locationArea || raw.area || nested.area || ''),
    pincode: String(raw.pincode || nested.pincode || '').trim(),
    formattedAddress: String(raw.formattedAddress || nested.formattedAddress || raw.pickupLocation || '').trim(),
    coordinates: point(lon, lat),
  };
}

async function upsertNode({ type, name, stateName = '', cityName = '', parent = null, pincode = '', formattedAddress = '', coordinates, source = 'listing' }) {
  const clean = titleCase(name);
  if (!clean) return null;
  const slug = toSlug(clean);
  const query = { type, slug, stateName: stateName || '', cityName: type === 'state' ? '' : cityName || '' };
  const update = {
    $setOnInsert: { type, name: clean, slug, stateName: stateName || '', cityName: type === 'state' ? '' : cityName || '', parent, source },
  };
  const set = {};
  if (pincode) set.pincode = pincode;
  if (formattedAddress) set.formattedAddress = formattedAddress;
  if (coordinates?.type === 'Point' && Array.isArray(coordinates.coordinates) && coordinates.coordinates.length === 2) {
    set.coordinates = coordinates;
  }
  if (Object.keys(set).length) update.$set = set;
  return Location.findOneAndUpdate(query, update, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function upsertHierarchy(loc = {}) {
  if (!loc.city && !loc.state && !loc.area) return loc;
  const state = loc.state ? await upsertNode({ type: 'state', name: loc.state, stateName: loc.state, source: loc.source || 'listing' }) : null;
  const city = loc.city
    ? await upsertNode({
        type: 'city',
        name: loc.city,
        stateName: loc.state || '',
        cityName: loc.city,
        parent: state?._id,
        coordinates: loc.coordinates,
        source: loc.source || 'listing',
      })
    : null;
  if (loc.area && loc.city) {
    await upsertNode({
      type: 'area',
      name: loc.area,
      stateName: loc.state || '',
      cityName: loc.city,
      parent: city?._id,
      pincode: loc.pincode,
      formattedAddress: loc.formattedAddress,
      coordinates: loc.coordinates,
      source: loc.source || 'listing',
    });
  }
  return loc;
}

async function nominatimSearch(q, { city = '', limit = 8 } = {}) {
  const query = String(q || '').trim();
  if (query.length < 2) return [];
  const key = `nom:${query.toLowerCase()}|${city}|${limit}`;
  if (cache.has(key) && Date.now() - cache.get(key).at < 10 * 60 * 1000) return cache.get(key).value;
  const params = {
    format: 'jsonv2',
    addressdetails: 1,
    limit,
    countrycodes: 'in',
    q: city ? `${query}, ${city}, India` : `${query}, India`,
  };
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params,
      timeout: 8000,
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN' },
    });
    const rows = (Array.isArray(data) ? data : []).map(mapNominatim).filter((row) => row.city || row.area);
    cache.set(key, { at: Date.now(), value: rows });
    return rows;
  } catch (err) {
    console.warn('nominatim search failed:', err.message);
    return [];
  }
}

function mapNominatim(hit = {}) {
  const addr = hit.address || {};
  const city = titleCase(addr.city || addr.town || addr.county || addr.state_district || '');
  const state = titleCase(addr.state || '');
  const area = titleCase(addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || addr.village || '');
  return {
    label: hit.display_name,
    state,
    city,
    area: area && area.toLowerCase() !== city.toLowerCase() ? area : '',
    pincode: addr.postcode || '',
    formattedAddress: hit.display_name || '',
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    coordinates: point(hit.lon, hit.lat),
    source: 'geocode',
  };
}

async function overpassAreas(cityName, stateName = '') {
  const city = titleCase(cityName);
  if (!city) return [];
  const key = `osm:${city.toLowerCase()}`;
  if (cache.has(key) && Date.now() - cache.get(key).at < 24 * 60 * 60 * 1000) return cache.get(key).value;
  const query = `[out:json][timeout:12];
area["name"="${city}"]["boundary"="administrative"]->.a;
node["place"~"suburb|neighbourhood"](area.a);
out 50;`;
  const urls = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter'];
  for (const url of urls) {
    try {
      const { data } = await axios.post(url, query, {
        timeout: 15000,
        headers: { 'User-Agent': UA, 'Content-Type': 'text/plain' },
      });
      const rows = (data.elements || [])
        .map((el) => {
          const name = titleCase(el.tags?.name || '');
          if (!name) return null;
          return {
            area: name,
            city,
            state: titleCase(stateName || el.tags?.['is_in:state'] || ''),
            lat: el.lat,
            lng: el.lon,
            coordinates: point(el.lon, el.lat),
            source: 'osm',
          };
        })
        .filter(Boolean);
      cache.set(key, { at: Date.now(), value: rows });
      return rows;
    } catch (err) {
      console.warn('overpass areas failed:', url, err.message);
    }
  }
  return [];
}

async function ensureCityRecord(cityName, stateName = '') {
  if (!cityName) return null;
  const rx = new RegExp(`^${escapeRegex(cityName)}$`, 'i');
  let city = await City.findOne({ name: rx });
  if (!city) city = await City.create({ name: titleCase(cityName), state: stateName || '' });
  else if (stateName && !city.state) {
    city.state = stateName;
    await city.save();
  }
  return city;
}

function inferAreaFromText(text, cityName) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return '';
  const cityRx = cityName ? new RegExp(`^${escapeRegex(cityName)}$`, 'i') : null;
  const first = parts[0];
  if (cityRx && cityRx.test(first)) return '';
  if (parts.length === 1 && cityRx && cityRx.test(raw)) return '';
  return titleCase(first);
}

async function normalizeListingLocation(payload = {}, cityDoc = null, { geocode = true } = {}) {
  const parsed = parseLocationPayload(payload);
  const cityFromDoc = cityDoc?.name || '';
  const stateFromDoc = cityDoc?.state || '';
  parsed.city = parsed.city || titleCase(cityFromDoc);
  parsed.state = parsed.state || titleCase(stateFromDoc);
  parsed.area = parsed.area || inferAreaFromText(payload.pickupLocation || parsed.formattedAddress, parsed.city);
  parsed.formattedAddress = parsed.formattedAddress || [parsed.area, parsed.city, parsed.state, parsed.pincode].filter(Boolean).join(', ');

  if (geocode && (!parsed.area || !parsed.coordinates) && (payload.pickupLocation || parsed.formattedAddress)) {
    const hits = await nominatimSearch(payload.pickupLocation || parsed.formattedAddress, { city: parsed.city, limit: 1 });
    const hit = hits[0];
    if (hit) {
      parsed.state = parsed.state || hit.state;
      parsed.city = parsed.city || hit.city;
      parsed.area = parsed.area || hit.area;
      parsed.pincode = parsed.pincode || hit.pincode;
      parsed.formattedAddress = parsed.formattedAddress || hit.formattedAddress;
      parsed.coordinates = parsed.coordinates || hit.coordinates;
      parsed.source = 'geocode';
    }
  }

  await ensureCityRecord(parsed.city, parsed.state);
  await upsertHierarchy(parsed);
  if (!parsed.coordinates?.coordinates) delete parsed.coordinates;
  return parsed;
}

async function recountLocations() {
  const grouped = await Car.aggregate([
    { $match: { ...publicListingFilter(), 'location.city': { $nin: [null, ''] } } },
    {
      $group: {
        _id: {
          state: { $ifNull: ['$location.state', ''] },
          city: '$location.city',
          area: { $ifNull: ['$location.area', ''] },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const cityCounts = new Map();
  const stateCounts = new Map();
  for (const row of grouped) {
    const state = titleCase(row._id.state);
    const city = titleCase(row._id.city);
    const area = titleCase(row._id.area);
    stateCounts.set(state, (stateCounts.get(state) || 0) + row.count);
    const cityKey = `${state}|${city}`;
    cityCounts.set(cityKey, (cityCounts.get(cityKey) || 0) + row.count);
    if (area) {
      await Location.updateOne(
        { type: 'area', slug: toSlug(area), cityName: city, stateName: state },
        { $set: { listingCount: row.count } }
      );
    }
  }
  for (const [key, count] of cityCounts) {
    const [state, city] = key.split('|');
    await Location.updateOne({ type: 'city', slug: toSlug(city), cityName: city, stateName: state }, { $set: { listingCount: count } });
  }
  for (const [state, count] of stateCounts) {
    if (!state) continue;
    await Location.updateOne({ type: 'state', slug: toSlug(state), stateName: state }, { $set: { listingCount: count } });
  }
}

async function backfillListingLocations() {
  const cars = await Car.find({
    $or: [{ location: { $exists: false } }, { 'location.city': { $in: [null, ''] } }],
  })
    .populate('city', 'name state')
    .limit(400)
    .select('city pickupLocation rto location');
  for (const car of cars) {
    try {
      car.location = await normalizeListingLocation(
        {
          cityName: car.city?.name,
          state: car.city?.state,
          pickupLocation: car.pickupLocation || car.city?.name,
          location: car.location,
        },
        car.city,
        { geocode: false }
      );
      if (!car.location.coordinates?.coordinates) delete car.location.coordinates;
      await car.save();
    } catch (err) {
      console.warn('location backfill skipped', car._id, err.message);
    }
  }
}

async function enrichActiveCitiesFromOsm() {
  const cities = await Location.find({ type: 'city' }).sort({ listingCount: -1 }).limit(8).lean();
  const fallback = await City.find({}).select('name state').lean();
  const targets = cities.length
    ? cities
    : fallback.map((c) => ({ name: c.name, cityName: c.name, stateName: c.state || '' }));
  for (const city of targets) {
    const cityName = city.cityName || city.name;
    const existing = await Location.countDocuments({ type: 'area', cityName });
    if (existing >= 8) continue;
    const areas = await overpassAreas(cityName, city.stateName || city.state || '');
    for (const row of areas.slice(0, 40)) {
      await upsertHierarchy({
        state: row.state || city.stateName || '',
        city: cityName,
        area: row.area,
        coordinates: row.coordinates,
        source: 'osm',
      });
    }
  }
}

async function bootstrapLocations() {
  try {
    await Location.updateMany(
      { $or: [{ 'coordinates.coordinates': { $size: 0 } }, { 'coordinates.coordinates': { $exists: true, $eq: [] } }] },
      { $unset: { coordinates: 1 } }
    );
    await backfillListingLocations();
    await recountLocations();
    await enrichActiveCitiesFromOsm();
    await recountLocations();
  } catch (err) {
    console.warn('location bootstrap failed:', err.message);
  }
}

function applyLocationFilters(filter, query = {}) {
  const state = String(query.state || '').trim();
  const cityName = String(query.cityName || '').trim();
  const areas = []
    .concat(query.area || query.areas || [])
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);

  if (state) filter['location.state'] = new RegExp(`^${escapeRegex(state)}$`, 'i');
  if (cityName) filter['location.city'] = new RegExp(`^${escapeRegex(cityName)}$`, 'i');
  if (areas.length === 1) filter['location.area'] = new RegExp(`^${escapeRegex(areas[0])}$`, 'i');
  else if (areas.length > 1) {
    filter['location.area'] = { $in: areas.map((a) => new RegExp(`^${escapeRegex(a)}$`, 'i')) };
  }

  const lat = Number(query.lat);
  const lng = Number(query.lng);
  const radiusKm = Number(query.radiusKm || query.radius);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radiusKm) && radiusKm > 0) {
    filter['location.coordinates'] = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    };
  }
  return filter;
}

async function defaultCityName() {
  const top = await Location.findOne({ type: 'city', listingCount: { $gt: 0 } }).sort({ listingCount: -1 }).lean();
  if (top?.name) return top.name;
  const city = await City.findOne().sort({ isPopular: -1, name: 1 }).lean();
  return city?.name || '';
}

async function autocompleteLocations(q, city = '') {
  const rx = new RegExp(escapeRegex(q), 'i');
  const filter = { name: rx };
  if (city) filter.$or = [{ cityName: new RegExp(`^${escapeRegex(city)}$`, 'i') }, { type: { $in: ['city', 'state'] } }];
  const docs = await Location.find(filter).sort({ listingCount: -1, type: 1, name: 1 }).limit(10).lean();
  return docs.map((d) => ({
    type: d.type,
    name: d.name,
    area: d.type === 'area' ? d.name : '',
    city: d.type === 'city' ? d.name : d.cityName || '',
    state: d.type === 'state' ? d.name : d.stateName || '',
    count: d.listingCount || 0,
    pincode: d.pincode || '',
    label: [d.type === 'area' ? d.name : null, d.type === 'city' ? d.name : d.cityName, d.type === 'state' ? d.name : d.stateName]
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)
      .join(', '),
  }));
}

module.exports = {
  toSlug,
  escapeRegex,
  titleCase,
  parseLocationPayload,
  upsertHierarchy,
  nominatimSearch,
  overpassAreas,
  normalizeListingLocation,
  recountLocations,
  bootstrapLocations,
  applyLocationFilters,
  defaultCityName,
  autocompleteLocations,
  ensureCityRecord,
};
