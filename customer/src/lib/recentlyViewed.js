const KEY = '4tyrezz:recently-viewed';
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

export function readRecentlyViewed() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((row) => row && row.id).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
  window.dispatchEvent(new Event(EVENT));
}

export function rememberRecentlyViewed(car) {
  const id = String(car?._id || car?.id || '');
  if (!id || id === 'error') return readRecentlyViewed();
  const next = [
    {
      id,
      title: titleOf(car),
      price: car.price,
      thumb: car.images?.[0] || car.photos?.[0] || '',
      km: car.kmDriven ?? car.km,
      fuel: car.fuel,
      transmission: car.transmission,
      city: cityOf(car),
      viewedAt: Date.now(),
    },
    ...readRecentlyViewed().filter((row) => row.id !== id),
  ];
  write(next);
  return next;
}

export function subscribeRecentlyViewed(cb) {
  const handler = () => cb(readRecentlyViewed());
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
