import { formatINR } from '../components/PageShell';

export const COMPARE_MAX = 4;

function shortName(c) {
  return c.model || c.title?.split(' ').slice(-2).join(' ') || 'Car';
}

function ownerLabel(n) {
  if (!n) return '—';
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : 'th';
  return `${n}${suffix} owner`;
}

function listed(c, re) {
  const hits = (c.features || []).map(String).filter((f) => re.test(f));
  return hits.length ? hits.slice(0, 6).join(', ') : '—';
}

/** CarDekho-style tabs, mapped to used-car listing fields only (no brochure fiction). */
export const COMPARE_GROUPS = [
  {
    key: 'basic',
    tab: 'Basic Information',
    label: 'Basic Information',
    rows: [
      ['Listed price', (c) => formatINR(c.price), 'min'],
      ['Market band', (c) => (c.marketPriceMin && c.marketPriceMax ? `${formatINR(c.marketPriceMin)} – ${formatINR(c.marketPriceMax)}` : '—')],
      ['Year', (c) => c.year ?? '—', 'max'],
      ['Registration year', (c) => c.registrationYear ?? '—'],
      ['Kilometres', (c) => (c.kmDriven != null ? `${Number(c.kmDriven).toLocaleString('en-IN')} km` : '—'), 'min'],
      ['Owners', (c) => ownerLabel(c.ownership), 'min'],
      ['Fuel', (c) => c.fuel || '—'],
      ['Transmission', (c) => c.transmission || '—'],
      ['Variant', (c) => c.variant || '—'],
      ['Body', (c) => c.bodyType || '—'],
      ['Colour', (c) => c.color || '—'],
      ['City', (c) => c.city || '—'],
    ],
  },
  {
    key: 'engine',
    tab: 'Engine',
    label: 'Engine',
    rows: [
      ['Engine', (c) => (c.engineDisplacement ? `${c.engineDisplacement} cc` : '—')],
      ['Fuel', (c) => c.fuel || '—'],
      ['Transmission', (c) => c.transmission || '—'],
      ['Claimed mileage', (c) => c.claimedMileage || '—'],
    ],
  },
  {
    key: 'performance',
    tab: 'Performance',
    label: 'Performance',
    rows: [
      ['Claimed mileage', (c) => c.claimedMileage || '—'],
      ['Usage condition', (c) => c.condition?.kmCondition || '—'],
      ['Kilometres', (c) => (c.kmDriven != null ? `${Number(c.kmDriven).toLocaleString('en-IN')} km` : '—'), 'min'],
    ],
  },
  {
    key: 'ride',
    tab: 'Ride & Control',
    label: 'Ride & Control',
    rows: [
      ['Transmission', (c) => c.transmission || '—'],
      ['Steering / ride kit', (c) => listed(c, /steering|suspension|traction|hill.?hold|esp|ebd|stability/i)],
    ],
  },
  {
    key: 'dimensions',
    tab: 'Dimensions',
    label: 'Body & space',
    rows: [
      ['Body type', (c) => c.bodyType || '—'],
      ['Seats', (c) => c.seats ?? '—', 'max'],
    ],
  },
  {
    key: 'comfort',
    tab: 'Comfort',
    label: 'Comfort',
    rows: [
      ['Comfort features', (c) => listed(c, /climate|air.?cond|\bac\b|ventilat|heater|cruise|keyless|push.?start|power.?window|lumbar|armrest|rear.?ac/i)],
    ],
  },
  {
    key: 'interior',
    tab: 'Interior',
    label: 'Interior',
    rows: [
      ['Interior colour', (c) => c.interiorColor || '—'],
      ['Cabin features', (c) => listed(c, /leather|fabric|upholster|cabin|ambient|irvm|interior|seat.?cover/i)],
    ],
  },
  {
    key: 'exterior',
    tab: 'Exterior',
    label: 'Exterior',
    rows: [
      ['Colour', (c) => c.color || '—'],
      ['Exterior features', (c) => listed(c, /alloy|sunroof|led|projector|fog|drl|chrome|roof.?rail|orvm|daytime/i)],
    ],
  },
  {
    key: 'safety',
    tab: 'Safety',
    label: 'Safety',
    rows: [
      ['Safety kit', (c) => (c.safetyFeatures?.length ? c.safetyFeatures.slice(0, 6).join(', ') : listed(c, /airbag|abs|brake|iso|child.?lock/i))],
    ],
  },
  {
    key: 'adas',
    tab: 'ADAS',
    label: 'ADAS',
    rows: [
      ['Camera / sensors / ADAS', (c) => listed(c, /adas|camera|parking.?sensor|blind.?spot|lane|aeb|360|forward.?collision/i)],
    ],
  },
  {
    key: 'entertainment',
    tab: 'Entertainment',
    label: 'Entertainment',
    rows: [
      ['Infotainment', (c) => listed(c, /android.?auto|apple.?car|touchscreen|infotain|speaker|music|bluetooth|usb|wifi|connected|internet|navigation|gps|radio/i)],
    ],
  },
  {
    key: 'condition',
    tab: 'Condition',
    label: 'Condition & papers',
    rows: [
      ['Inspection score', (c) => (c.inspectionScore != null ? `${c.inspectionScore}/100` : '—'), 'max'],
      ['Inspection report', (c) => c.warranty?.inspectionReport || '—'],
      ['Accidental', (c) => c.warranty?.accidental || c.condition?.accidental || '—'],
      ['Odometer', (c) => c.condition?.odometerTampered || '—'],
      ['Insurance', (c) => c.warranty?.insuranceType || c.insuranceType || '—'],
      ['Insurance valid till', (c) => c.warranty?.insuranceExpiry || '—'],
      ['PUC valid till', (c) => c.warranty?.pucExpiry || '—'],
      ['Service history', (c) => c.warranty?.serviceHistory || '—'],
    ],
  },
];

export function displayText(node) {
  if (node == null || node === false || node === true) return '—';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(displayText).join('').trim() || '—';
  if (typeof node === 'object' && node.props) return displayText(node.props.children);
  return '—';
}

function numericFor(c, fn) {
  const raw = fn(c);
  if (raw == null || typeof raw === 'object') return null;
  if (typeof raw === 'number') return raw;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function winners(cars, fn, mode) {
  if (!mode || cars.length < 2) return new Set();
  const vals = cars.map((c) => numericFor(c, fn));
  const usable = vals.filter((v) => v != null);
  if (!usable.length) return new Set();
  const target = mode === 'min' ? Math.min(...usable) : Math.max(...usable);
  return new Set(cars.filter((_, i) => vals[i] === target).map((c) => c.id));
}

export function rowIsSame(cars, fn) {
  if (cars.length < 2) return false;
  const texts = cars.map((c) => displayText(fn(c)));
  return texts.every((t) => t === texts[0]);
}

function uniqueWinner(cars, get, mode) {
  const vals = cars.map((c) => ({ c, v: Number(get(c)) })).filter((x) => Number.isFinite(x.v) && x.v > 0);
  if (vals.length < 2) return null;
  const target = mode === 'min' ? Math.min(...vals.map((x) => x.v)) : Math.max(...vals.map((x) => x.v));
  const wins = vals.filter((x) => x.v === target);
  return wins.length === 1 ? wins[0].c : null;
}

export function goodToKnow(cars) {
  if (!cars || cars.length < 2) return [];
  const items = [];
  const price = uniqueWinner(cars, (c) => c.price, 'min');
  if (price) items.push(`${shortName(price)} has the lower listed price`);
  const km = uniqueWinner(cars, (c) => c.kmDriven, 'min');
  if (km) items.push(`${shortName(km)} has driven fewer kilometres`);
  const year = uniqueWinner(cars, (c) => c.year, 'max');
  if (year) items.push(`${shortName(year)} is a newer year`);
  const score = uniqueWinner(cars, (c) => c.inspectionScore, 'max');
  if (score) items.push(`${shortName(score)} has a better inspection score`);
  const owners = uniqueWinner(cars, (c) => c.ownership, 'min');
  if (owners) items.push(`${shortName(owners)} has fewer previous owners`);
  return items.slice(0, 5);
}
