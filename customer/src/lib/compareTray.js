const KEY = '4tyrezz:compare';
const MAX = 4;
const EVENT = '4tyrezz-compare';

export function readCompare() {
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

export function addCompare(car) {
  const id = String(car._id || car.id);
  const existing = readCompare();
  if (existing.some((row) => row.id === id)) return { ok: false, items: existing, full: false, already: true };
  if (existing.length >= MAX) return { ok: false, items: existing, full: true };
  const next = [
    ...existing,
    {
      id,
      title: car.title || `${car.year || ''} ${car.brand?.name || ''} ${car.model?.name || ''}`.trim(),
      price: car.price,
      thumb: car.images?.[0] || car.photos?.[0] || '',
    },
  ];
  write(next);
  return { ok: true, items: next };
}

export function removeCompare(id) {
  const next = readCompare().filter((row) => row.id !== String(id));
  write(next);
  return next;
}

export function clearCompare() {
  write([]);
}

export function subscribeCompare(cb) {
  const handler = () => cb(readCompare());
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export const COMPARE_MAX = MAX;
