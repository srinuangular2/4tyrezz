const Location = require('../models/Location');
const {
  nominatimSearch,
  autocompleteLocations,
  defaultCityName,
  upsertHierarchy,
  overpassAreas,
} = require('../services/locationService');

function unwrap(docs) {
  return (docs || []).map((d) => ({
    id: d._id,
    type: d.type,
    name: d.name,
    slug: d.slug,
    state: d.stateName || (d.type === 'state' ? d.name : ''),
    city: d.cityName || (d.type === 'city' ? d.name : ''),
    area: d.type === 'area' ? d.name : '',
    pincode: d.pincode || '',
    count: d.listingCount || 0,
    coordinates: d.coordinates?.coordinates || null,
    label: [d.type === 'area' ? d.name : null, d.type === 'city' ? d.name : d.cityName, d.type === 'state' ? d.name : d.stateName]
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)
      .join(', '),
  }));
}

exports.activeCities = async (_req, res) => {
  try {
    const cities = await Location.find({ type: 'city' }).sort({ listingCount: -1, name: 1 }).lean();
    const states = await Location.find({ type: 'state' }).sort({ listingCount: -1, name: 1 }).lean();
    res.json({ success: true, cities: unwrap(cities), states: unwrap(states) });
  } catch (err) {
    console.error('active-cities', err);
    res.status(500).json({ message: 'Could not load cities' });
  }
};

exports.areas = async (req, res) => {
  try {
    const city = String(req.query.city || '').trim() || (await defaultCityName());
    if (!city) return res.json({ success: true, city: '', areas: [], popular: [] });
    const rx = new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let areas = await Location.find({ type: 'area', cityName: rx }).sort({ listingCount: -1, name: 1 }).lean();
    if (areas.length < 6) {
      const cityNode = await Location.findOne({ type: 'city', cityName: rx });
      const osm = await overpassAreas(city, cityNode?.stateName || '');
      await Promise.all(osm.slice(0, 40).map((row) => upsertHierarchy({
        state: row.state || cityNode?.stateName || '',
        city,
        area: row.area,
        coordinates: row.coordinates,
        source: 'osm',
      })));
      areas = await Location.find({ type: 'area', cityName: rx }).sort({ listingCount: -1, name: 1 }).lean();
    }
    const rows = unwrap(areas);
    res.json({
      success: true,
      city,
      areas: rows,
      popular: rows.filter((r) => r.count > 0).slice(0, 8),
    });
  } catch (err) {
    console.error('areas', err);
    res.status(500).json({ message: 'Could not load areas' });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const city = String(req.query.city || '').trim();
    if (q.length < 2) return res.json({ success: true, q, locations: [] });
    const [dbHits, geoHits] = await Promise.all([
      autocompleteLocations(q, city),
      nominatimSearch(q, { city, limit: 5 }),
    ]);
    const seen = new Set();
    const locations = [];
    for (const row of [
      ...dbHits,
      ...geoHits.map((g) => ({
        type: g.area ? 'area' : 'city',
        name: g.area || g.city,
        area: g.area,
        city: g.city,
        state: g.state,
        count: 0,
        pincode: g.pincode,
        label: [g.area, g.city, g.state].filter(Boolean).join(', '),
        lat: g.lat,
        lng: g.lng,
      })),
    ]) {
      const key = `${row.area}|${row.city}|${row.state}`.toLowerCase();
      if (seen.has(key) || !row.label) continue;
      seen.add(key);
      locations.push(row);
    }
    res.json({ success: true, q, locations: locations.slice(0, 10) });
  } catch (err) {
    console.error('location autocomplete', err);
    res.status(500).json({ message: 'Could not search locations' });
  }
};

exports.geocode = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const city = String(req.query.city || '').trim();
    if (q.length < 3) return res.json({ success: true, results: [] });
    const results = await nominatimSearch(q, { city, limit: 8 });
    results.forEach((row) => {
      upsertHierarchy(row).catch(() => {});
    });
    res.json({ success: true, results });
  } catch (err) {
    console.error('geocode', err);
    res.status(500).json({ message: 'Could not geocode address' });
  }
};
