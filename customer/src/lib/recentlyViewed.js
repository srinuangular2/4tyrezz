import api from '../api/axios';

const LEGACY_KEYS = ['4tyrezz:recently-viewed', 'recentlyViewed'];
const MAX = 8;
const EVENT = '4tyrezz-recently-viewed';

function titleOf(car) {
  return (
    car.title ||
    [car.year, car.brand?.name || car.brand, car.model?.name || car.model, car.variant]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Used car'
  );
}

function cityOf(car) {
  return (
    [car.location?.area, car.location?.city || car.city?.name || car.cityName].filter(Boolean).join(', ') ||
    car.city?.name ||
    car.city ||
    ''
  );
}

export function scopedViewKey(userId) {
  const id = String(userId || '').trim();
  return id ? `recentlyViewed_${id}` : '';
}

function dropLegacyKeys() {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

function snapshotFromCar(car) {
  const id = String(car?._id || car?.id || '');
  return {
    id,
    title: titleOf(car),
    price: car.price,
    thumb: car.images?.[0] || car.photos?.[0] || car.thumb || '',
    km: car.kmDriven ?? car.km,
    fuel: car.fuel,
    transmission: car.transmission,
    city: cityOf(car),
    viewedAt: Date.now(),
  };
}

function emitChange() {
  window.dispatchEvent(new Event(EVENT));
}

export function readRecentlyViewed(userId) {
  dropLegacyKeys();
  const key = scopedViewKey(userId);
  if (!key) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw.filter((row) => row && row.id).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function writeScoped(userId, rows) {
  dropLegacyKeys();
  const key = scopedViewKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify((rows || []).slice(0, MAX)));
  } catch {
    /* ignore quota */
  }
  emitChange();
}

/** Clears in-memory listeners' state. Per-account keys stay so the next login loads only that user. */
export function flushRecentlyViewed() {
  dropLegacyKeys();
  emitChange();
}

export async function fetchRecentlyViewed(userId) {
  if (!userId) return [];
  try {
    const { data } = await api.get('/user/view-history');
    const rows = Array.isArray(data.data) ? data.data : [];
    writeScoped(userId, rows);
    return rows;
  } catch {
    return readRecentlyViewed(userId);
  }
}

export async function rememberRecentlyViewed(car, userId) {
  if (!userId) return [];
  const row = snapshotFromCar(car);
  if (!row.id || row.id === 'error') return readRecentlyViewed(userId);
  const optimistic = [row, ...readRecentlyViewed(userId).filter((item) => item.id !== row.id)].slice(0, MAX);
  writeScoped(userId, optimistic);
  try {
    await api.post('/user/view-history', { vehicleId: row.id });
    return fetchRecentlyViewed(userId);
  } catch {
    return optimistic;
  }
}

export function subscribeRecentlyViewed(cb, userIdGetter) {
  const handler = () => cb(readRecentlyViewed(typeof userIdGetter === 'function' ? userIdGetter() : userIdGetter));
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
