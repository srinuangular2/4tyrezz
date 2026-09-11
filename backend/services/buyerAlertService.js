const Notification = require('../models/Notification');
const SavedSearch = require('../models/SavedSearch');
const Wishlist = require('../models/Wishlist');
const Car = require('../models/Car');
const { emitToRooms, userRoom } = require('./socketService');
const { serializeDoc } = require('./notifyService');
const { sendWhatsAppTemplate } = require('./integrations/msg91Service');

const DEDUPE_MS = 12 * 60 * 60 * 1000;
const POPULATE = 'brand model city owner';

function norm(v) {
  return String(v || '').trim().toLowerCase();
}

function asId(v) {
  if (!v) return '';
  if (typeof v === 'object') return String(v._id || v.id || '');
  return String(v);
}

function asName(v) {
  if (!v) return '';
  if (typeof v === 'object') return String(v.name || '');
  return String(v);
}

function matchesRef(carVal, filterVal) {
  if (filterVal == null || filterVal === '') return true;
  const f = String(filterVal).trim();
  const id = asId(carVal);
  const name = asName(carVal);
  if (/^[a-fA-F0-9]{24}$/.test(f)) return id === f;
  const n = norm(name);
  const needle = norm(f);
  return n === needle || (n && needle && (n.includes(needle) || needle.includes(n)));
}

function isPublicListing(car) {
  if (!car) return false;
  if (car.unpublished) return false;
  const status = String(car.status || '');
  return status === 'approved' || status === 'PUBLISHED';
}

function carMatchesFilters(car, filters = {}) {
  if (!filters || typeof filters !== 'object') return true;

  if (filters.brand && !matchesRef(car.brand, filters.brand)) return false;
  if (filters.model && !matchesRef(car.model, filters.model)) return false;

  const cityFilter = filters.city || filters.location;
  if (cityFilter) {
    const locCity = car.location?.city || '';
    const cityOk = matchesRef(car.city, cityFilter) || norm(locCity) === norm(cityFilter)
      || (locCity && norm(locCity).includes(norm(cityFilter)));
    if (!cityOk) return false;
  }
  if (filters.state) {
    const state = car.location?.state || asName(car.city);
    if (state && !norm(state).includes(norm(filters.state)) && !norm(filters.state).includes(norm(state))) return false;
  }
  if (filters.area || filters.areas) {
    const wanted = String(filters.area || filters.areas)
      .split(',')
      .map((s) => norm(s))
      .filter(Boolean);
    if (wanted.length) {
      const area = norm(car.location?.area);
      if (!wanted.some((w) => area === w || area.includes(w) || w.includes(area))) return false;
    }
  }

  if (filters.fuel && norm(car.fuel) !== norm(filters.fuel)) return false;
  if (filters.transmission && norm(car.transmission) !== norm(filters.transmission)) return false;
  if (filters.bodyType && norm(car.bodyType) !== norm(filters.bodyType)) return false;
  if (filters.color && norm(car.color) !== norm(filters.color)) return false;
  if (filters.ownership != null && filters.ownership !== '' && Number(car.ownership) !== Number(filters.ownership)) {
    return false;
  }

  const price = Number(car.price);
  if (filters.minPrice && Number.isFinite(price) && price < Number(filters.minPrice)) return false;
  if (filters.maxPrice && Number.isFinite(price) && price > Number(filters.maxPrice)) return false;
  const year = Number(car.year);
  if (filters.minYear && Number.isFinite(year) && year < Number(filters.minYear)) return false;
  if (filters.maxYear && Number.isFinite(year) && year > Number(filters.maxYear)) return false;
  const km = Number(car.kmDriven);
  if (filters.minKm && Number.isFinite(km) && km < Number(filters.minKm)) return false;
  if (filters.maxKm && Number.isFinite(km) && km > Number(filters.maxKm)) return false;

  const term = String(filters.search || filters.q || '').trim();
  if (term) {
    const hay = [
      car.title,
      car.variant,
      asName(car.brand),
      asName(car.model),
      car.fuel,
      car.bodyType,
      car.pickupLocation,
      car.location?.area,
      car.location?.city,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay.includes(term.toLowerCase())) return false;
  }

  return true;
}

function wantsNewMatch(ss) {
  if (ss.newMatchAlerts === true) return true;
  if (ss.newMatchAlerts === false) return false;
  return Boolean(ss.alertsEnabled || ss.emailAlerts || ss.whatsappAlerts);
}

function wantsPriceChange(ss) {
  if (ss.priceChangeAlerts === true) return true;
  if (ss.priceChangeAlerts === false) return false;
  return Boolean(ss.alertsEnabled || ss.emailAlerts || ss.whatsappAlerts);
}

function consentOn(user, key) {
  const consents = user?.consents || {};
  if (consents[key] === false) return false;
  return true;
}

function listingLabel(car) {
  return car.title || [car.year, asName(car.brand), asName(car.model)].filter(Boolean).join(' ') || 'A saved car';
}

function formatInr(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

async function hydrate(carLike) {
  if (!carLike) return null;
  if (carLike.brand && typeof carLike.brand === 'object' && carLike.brand.name) return carLike;
  const id = carLike._id || carLike;
  return Car.findById(id).populate(POPULATE).lean();
}

async function notifyBuyer({ user, title, body, type, link, meta, channels }) {
  const userId = user._id || user;
  const recent = await Notification.findOne({
    user: userId,
    type,
    'meta.carId': String(meta.carId || ''),
    createdAt: { $gte: new Date(Date.now() - DEDUPE_MS) },
  }).select('_id');
  if (recent) return null;

  const doc = await Notification.create({
    user: userId,
    recipientRole: 'customer',
    title,
    body,
    type,
    event: '',
    link: link || '',
    meta,
  });

  const payload = {
    type,
    title,
    message: body,
    body,
    link: link || '',
    createdAt: new Date().toISOString(),
    notification: serializeDoc(doc),
    meta,
    entityId: String(meta.carId || ''),
  };
  emitToRooms([userRoom(userId)], 'notification', payload);

  if (channels?.whatsapp && (user.mobile || user.consents?.whatsappUpdates)) {
    sendWhatsAppTemplate({
      mobile: user.mobile,
      templateName: 'buyer_alert',
      bodyValues: [title, body],
    }).catch(() => {});
  }
  if (channels?.email && user.email) {
    console.log(`[buyer-alert:email] ${user.email} · ${title} · ${body}`);
  }

  return doc;
}

async function onPriceChange(carLike, previousPrice) {
  const car = await hydrate(carLike);
  if (!car) return;
  const prev = Number(previousPrice);
  const next = Number(car.price);
  if (!Number.isFinite(prev) || !Number.isFinite(next) || prev === next) return;

  const dropped = next < prev;
  const label = listingLabel(car);
  const carId = String(car._id);
  const ownerId = asId(car.owner);

  const wishes = await Wishlist.find({ car: car._id }).populate('user', 'name email mobile consents role').lean();
  for (const row of wishes) {
    const user = row.user;
    if (!user || String(user._id) === ownerId) continue;
    if (user.role && user.role !== 'customer') continue;
    if (!dropped) continue;
    if (!consentOn(user, 'wishlistPriceDrop')) continue;
    await notifyBuyer({
      user,
      title: 'Price drop on a shortlisted car',
      body: `${label} is now ${formatInr(next)} (was ${formatInr(prev)}).`,
      type: 'price_drop',
      link: `/cars/${carId}`,
      meta: { kind: 'wishlist_price_drop', carId, previousPrice: prev, price: next },
      channels: { whatsapp: user.consents?.whatsappUpdates, email: false },
    });
  }

  if (!isPublicListing(car)) return;

  const searches = await SavedSearch.find({
    $or: [{ priceChangeAlerts: true }, { alertsEnabled: true }, { emailAlerts: true }, { whatsappAlerts: true }],
  })
    .populate('user', 'name email mobile consents role')
    .lean();

  for (const ss of searches) {
    if (!wantsPriceChange(ss)) continue;
    const user = ss.user;
    if (!user || String(user._id) === ownerId) continue;
    if (user.role && user.role !== 'customer') continue;
    if (!carMatchesFilters(car, ss.filters || {})) continue;
    await notifyBuyer({
      user,
      title: dropped ? 'Price drop on a matching car' : 'Price change on a matching car',
      body: `${label} is now ${formatInr(next)} (was ${formatInr(prev)}).`,
      type: dropped ? 'price_drop' : 'match',
      link: `/cars/${carId}`,
      meta: { kind: 'saved_search_price', carId, savedSearchId: String(ss._id), previousPrice: prev, price: next },
      channels: { whatsapp: ss.whatsappAlerts, email: ss.emailAlerts },
    });
  }
}

async function onAvailabilityChange(carLike, { reason } = {}) {
  const car = await hydrate(carLike);
  if (!car) return;
  const status = String(car.status || '').toLowerCase();
  const listing = String(car.listingStatus || '').toUpperCase();
  const avail = String(car.availability || '').toLowerCase();
  const gone = car.unpublished === true
    || status === 'sold'
    || listing === 'SOLD'
    || listing === 'UNPUBLISHED'
    || avail === 'unavailable'
    || avail === 'reserved';
  if (!gone) return;

  const label = listingLabel(car);
  const carId = String(car._id);
  const ownerId = asId(car.owner);
  let detail = 'is no longer available';
  if (status === 'sold' || listing === 'SOLD' || reason === 'sold') detail = 'has been marked sold';
  else if (avail === 'reserved') detail = 'is now reserved';
  else if (car.unpublished || listing === 'UNPUBLISHED') detail = 'was unpublished';

  const wishes = await Wishlist.find({ car: car._id }).populate('user', 'name email mobile consents role').lean();
  for (const row of wishes) {
    const user = row.user;
    if (!user || String(user._id) === ownerId) continue;
    if (user.role && user.role !== 'customer') continue;
    if (!consentOn(user, 'wishlistAvailability')) continue;
    await notifyBuyer({
      user,
      title: 'Shortlisted car availability changed',
      body: `${label} ${detail}.`,
      type: 'system',
      link: `/cars/${carId}`,
      meta: { kind: 'wishlist_availability', carId, reason: reason || listing || avail },
      channels: { whatsapp: user.consents?.whatsappUpdates },
    });
  }
}

async function onListingPublished(carLike) {
  const car = await hydrate(carLike);
  if (!car || !isPublicListing(car)) return;

  const label = listingLabel(car);
  const carId = String(car._id);
  const ownerId = asId(car.owner);

  const searches = await SavedSearch.find({
    $or: [{ newMatchAlerts: true }, { alertsEnabled: true }, { emailAlerts: true }, { whatsappAlerts: true }],
  })
    .populate('user', 'name email mobile consents role')
    .lean();

  for (const ss of searches) {
    if (!wantsNewMatch(ss)) continue;
    const user = ss.user;
    if (!user || String(user._id) === ownerId) continue;
    if (user.role && user.role !== 'customer') continue;
    if (!carMatchesFilters(car, ss.filters || {})) continue;
    await notifyBuyer({
      user,
      title: 'New car matches your saved search',
      body: `${label} is now live${car.price ? ` at ${formatInr(car.price)}` : ''}.`,
      type: 'match',
      link: `/cars/${carId}`,
      meta: { kind: 'saved_search_new', carId, savedSearchId: String(ss._id) },
      channels: { whatsapp: ss.whatsappAlerts, email: ss.emailAlerts },
    });
  }
}

function runSafe(fn) {
  return Promise.resolve()
    .then(fn)
    .catch((err) => {
      console.warn('[buyer-alerts]', err.message);
    });
}

module.exports = {
  carMatchesFilters,
  onPriceChange: (car, prev) => runSafe(() => onPriceChange(car, prev)),
  onAvailabilityChange: (car, opts) => runSafe(() => onAvailabilityChange(car, opts)),
  onListingPublished: (car) => runSafe(() => onListingPublished(car)),
};
