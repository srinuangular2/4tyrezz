const KEY = '4tyrezz:cart';
const EVENT = '4tyrezz-cart';

export function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((row) => row && row.id) : [];
  } catch {
    return [];
  }
}

function write(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(car) {
  const id = String(car._id || car.id);
  const existing = readCart();
  if (existing.some((row) => row.id === id)) return { ok: false, items: existing, already: true };
  const next = [
    {
      id,
      title: car.title || `${car.year || ''} ${car.brand?.name || ''} ${car.model?.name || ''}`.trim(),
      price: car.price,
      year: car.year,
      fuel: car.fuel,
      thumb: car.images?.[0] || car.photos?.[0] || '',
    },
    ...existing,
  ];
  write(next);
  return { ok: true, items: next };
}

export function removeFromCart(id) {
  const next = readCart().filter((row) => row.id !== String(id));
  write(next);
  return next;
}

export function subscribeCart(cb) {
  const handler = () => cb(readCart());
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
