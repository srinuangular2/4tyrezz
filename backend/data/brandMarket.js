/** India used-car market windows and logos. Used when a source has no launch date. */

const nowYear = () => new Date().getFullYear();

const POPULAR_BRANDS = [
  'Maruti Suzuki',
  'Hyundai',
  'Honda',
  'Tata',
  'Mahindra',
  'Renault',
  'Toyota',
  'Kia',
];

/** Last year the brand sold cars in India (omit = still selling). */
const BRAND_END_YEAR = {
  Austin: 1995,
  Chevrolet: 2017,
  Daewoo: 2004,
  Datsun: 2022,
  Fiat: 2019,
  Ford: 2022,
  'Hindustan Motors': 2014,
  Hummer: 2010,
  ICML: 2013,
  Opel: 2006,
  Premier: 2016,
  Reva: 2019,
  San: 2012,
};

const LOGO_SLUG = {
  'maruti suzuki': 'suzuki',
  'mercedes-benz': 'mercedes-benz',
  'land rover': 'land-rover',
  'rolls-royce': 'rolls-royce',
  'ashok leyland': 'ashok-leyland',
  'hindustan motors': 'hindustan',
  'aston martin': 'aston-martin',
  'alfa romeo': 'alfa-romeo',
  'force': 'force-motors',
  'ssangyong': 'ssangyong',
  'mini': 'mini',
  'mg': 'mg',
  'byd': 'byd',
  'bmw': 'bmw',
  'vw': 'volkswagen',
};

function rangeYears(from, to) {
  const now = nowYear();
  let start = Number(from);
  let end = Number(to);
  if (!start || start < 1980) start = 1980;
  if (!end || end > now) end = now;
  if (start > end) return [];
  const years = [];
  for (let y = end; y >= start; y -= 1) years.push(y);
  return years;
}

function marketYears(brand, source) {
  const now = nowYear();
  const end = Math.min(BRAND_END_YEAR[brand] || now, now);
  let start = source === 'variantwise' ? Math.max(1980, now - 14) : 1998;
  if (end < start) start = Math.max(1980, end - 12);
  return rangeYears(start, end);
}

function brandLogoSlug(name) {
  const n = String(name || '').trim().toLowerCase();
  if (LOGO_SLUG[n]) return LOGO_SLUG[n];
  return n.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function brandLogoUrl(name) {
  const slug = brandLogoSlug(name);
  if (!slug) return '';
  return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${slug}.png`;
}

/** Brands CarDekho lists that older dumps omit. */
const EXTRA_MARKET_MODELS = [
  ['Bajaj', 'Qute'],
  ['Caterham', 'Seven'],
  ['Chrysler', '300C'],
  ['Conquest', 'Knight'],
  ['DC', 'Avanti'],
  ['Isuzu', 'D-Max'],
  ['Isuzu', 'MU-X'],
  ['Isuzu', 'V-Cross'],
  ['Ssangyong', 'Rexton'],
  ['Ssangyong', 'Tivoli'],
];

function extraMarketRows() {
  return EXTRA_MARKET_MODELS.map(([brand, model]) => ({
    brand,
    model,
    bodyType: '',
    fuelType: '',
    transmission: '',
    variant: '',
    years: marketYears(brand, 'market-extra'),
    source: 'market-extra',
    sourceKey: `market::${brand}::${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));
}

module.exports = {
  POPULAR_BRANDS,
  rangeYears,
  marketYears,
  brandLogoUrl,
  extraMarketRows,
};
