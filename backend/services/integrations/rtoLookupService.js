/**
 * Live RC / VAHAN lookup.
 * Primary: RapidAPI RTO Vehicle Information India
 *   POST { vehicle_no } → make / model / year / fuel / RTO
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Brand = require('../../models/Brand');
const CarModel = require('../../models/CarModel');

const CACHE_FILE = path.join(__dirname, '../../.cache/rto-lookups.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let rateLimitedUntil = 0;

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeCache(store) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store));
  } catch (err) {
    console.warn('[rto] cache write skipped:', err.message);
  }
}

function cacheGet(reg) {
  const row = readCache()[reg];
  if (!row || Date.now() - row.at > CACHE_TTL_MS) return null;
  return row.data;
}

function cacheSet(reg, data) {
  const store = readCache();
  store[reg] = { at: Date.now(), data };
  writeCache(store);
}

const MAKES = [
  ['MERCEDES-BENZ', 'Mercedes-Benz'],
  ['MERCEDES BENZ', 'Mercedes-Benz'],
  ['MARUTI SUZUKI', 'Maruti Suzuki'],
  ['MARUTI', 'Maruti Suzuki'],
  ['HYUNDAI', 'Hyundai'],
  ['HONDA', 'Honda'],
  ['TOYOTA', 'Toyota'],
  ['TATA MOTORS', 'Tata'],
  ['TATA', 'Tata'],
  ['MAHINDRA', 'Mahindra'],
  ['KIA', 'Kia'],
  ['VOLKSWAGEN', 'Volkswagen'],
  ['SKODA', 'Skoda'],
  ['RENAULT', 'Renault'],
  ['NISSAN', 'Nissan'],
  ['FORD', 'Ford'],
  ['MG MOTOR', 'MG'],
  ['MORRIS GARAGES', 'MG'],
  ['BMW', 'BMW'],
  ['AUDI', 'Audi'],
  ['JEEP', 'Jeep'],
  ['VOLVO', 'Volvo'],
  ['JAGUAR', 'Jaguar'],
];

const RTO_PREFIX = {
  TS09: { city: 'Hyderabad', state: 'Telangana', rto: 'RTA HYDERABAD' },
  TS07: { city: 'Hyderabad', state: 'Telangana', rto: 'RTA HYDERABAD' },
  TS08: { city: 'Hyderabad', state: 'Telangana', rto: 'RTA HYDERABAD' },
  TS10: { city: 'Hyderabad', state: 'Telangana', rto: 'RTA RANGAREDDY' },
  KA01: { city: 'Bengaluru', state: 'Karnataka', rto: 'RTO BENGALURU CENTRAL' },
  KA03: { city: 'Bengaluru', state: 'Karnataka', rto: 'RTO BENGALURU EAST' },
  KA05: { city: 'Bengaluru', state: 'Karnataka', rto: 'RTO BENGALURU WEST' },
  MH01: { city: 'Mumbai', state: 'Maharashtra', rto: 'RTO MUMBAI CENTRAL' },
  MH02: { city: 'Mumbai', state: 'Maharashtra', rto: 'RTO MUMBAI WEST' },
  MH04: { city: 'Thane', state: 'Maharashtra', rto: 'RTO THANE' },
  MH12: { city: 'Pune', state: 'Maharashtra', rto: 'RTO PUNE' },
  DL: { city: 'Delhi', state: 'Delhi', rto: 'RTO DELHI' },
  TN01: { city: 'Chennai', state: 'Tamil Nadu', rto: 'RTO CHENNAI CENTRAL' },
  AP31: { city: 'Visakhapatnam', state: 'Andhra Pradesh', rto: 'RTA VISAKHAPATNAM' },
  GJ01: { city: 'Ahmedabad', state: 'Gujarat', rto: 'RTO AHMEDABAD' },
  RJ14: { city: 'Jaipur', state: 'Rajasthan', rto: 'RTO JAIPUR' },
};

function normalizeReg(regNumber = '') {
  return String(regNumber).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function formatReg(reg) {
  const c = normalizeReg(reg);
  const m = c.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : c;
}

function resolveRto(reg) {
  const c = normalizeReg(reg);
  const keys = Object.keys(RTO_PREFIX).sort((a, b) => b.length - a.length);
  const hit = keys.find((k) => c.startsWith(k));
  return hit ? { code: hit, ...RTO_PREFIX[hit] } : { code: c.slice(0, 4), city: '', state: '', rto: '' };
}

function lookupError(message, status = 502, extra = {}) {
  const err = new Error(message);
  err.status = status;
  Object.assign(err, extra);
  return err;
}

function titleCase(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

function normalizeFuel(raw = '') {
  const v = String(raw).toUpperCase();
  if (v.includes('DIESEL')) return 'Diesel';
  if (v.includes('CNG')) return 'CNG';
  if (v.includes('ELECTRIC') || v.includes('EV')) return 'Electric';
  if (v.includes('HYBRID')) return 'Hybrid';
  if (v.includes('PETROL')) return 'Petrol';
  return titleCase(raw) || 'Petrol';
}

function inferTransmission(variant = '', explicit = '') {
  const blob = `${variant} ${explicit}`.toUpperCase();
  if (/\b(IVT|CVT|DCT|AMT|AT|AUTOMATIC|I-DVT|TORQUE)\b/.test(blob)) return 'Automatic';
  if (explicit) return /auto/i.test(explicit) ? 'Automatic' : 'Manual';
  return 'Manual';
}

function inferBody(category = '', model = '') {
  const blob = `${category} ${model}`.toUpperCase();
  if (/\bMUV\b/.test(blob)) return 'MUV';
  if (/\bSUV\b|\bJEEP\b/.test(blob)) return 'SUV';
  if (/\bSEDAN\b/.test(blob)) return 'Sedan';
  if (/\bHATCH/.test(blob)) return 'Hatchback';
  return 'Hatchback';
}

function unwrap(v) {
  if (v == null) return '';
  if (typeof v === 'object' && !Array.isArray(v)) {
    return unwrap(v.name || v.value || v.desc || v.description || v.text || v.label || v.title || '');
  }
  const s = String(v).trim();
  if (!s || /^(object|null|undefined|n\/a|na|none|-)$/i.test(s)) return '';
  if (/^0001-01-01/.test(s)) return '';
  return s;
}

function flatten(obj, out = {}, prefix = '') {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !unwrap(v)) {
      flatten(v, out, key);
    } else {
      const val = unwrap(v);
      if (val) out[key] = val;
    }
  });
  return out;
}

function pick(flat, names) {
  const keys = Object.keys(flat);
  for (const name of names) {
    const want = name.toLowerCase().replace(/_/g, '');
    const hit = keys.find((k) => {
      const last = k.split('.').pop().toLowerCase().replace(/_/g, '');
      const full = k.toLowerCase().replace(/_/g, '');
      return last === want || full === want || last.endsWith(want) || full.endsWith(want);
    });
    if (hit && flat[hit] != null && String(flat[hit]).trim() !== '') return String(flat[hit]).trim();
  }
  return '';
}

function sanitizeForLog(obj, depth = 0) {
  if (obj == null || depth > 4) return typeof obj;
  if (Array.isArray(obj)) return obj.slice(0, 3).map((x) => sanitizeForLog(x, depth + 1));
  if (typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/(owner|father|address|chasi|chassis|engine|mobile|phone|email|present|permanent)/i.test(k)) {
      out[k] = typeof v === 'string' ? `[redacted ${v.length}]` : '[redacted]';
    } else {
      out[k] = sanitizeForLog(v, depth + 1);
    }
  }
  return out;
}

function splitMakeModel(maker = '', makerModel = '') {
  const combined = `${maker} ${makerModel}`.replace(/\s+/g, ' ').trim();
  const upper = combined.toUpperCase();
  const hit = MAKES.find(([k]) => upper.includes(k));
  const brand = hit ? hit[1] : titleCase((maker || makerModel).split(/MOTOR|INDIA|LTD|LIMITED/i)[0]);
  let rest = makerModel || combined;
  if (hit) {
    const idx = rest.toUpperCase().indexOf(hit[0]);
    if (idx >= 0) rest = rest.slice(idx + hit[0].length);
  }
  rest = rest.replace(/MOTOR INDIA LTD/gi, '').replace(/LIMITED/gi, '').replace(/INDIA LTD/gi, '').trim();
  const parts = rest.split(/\s+/).filter(Boolean);
  return {
    brand,
    model: parts[0] || titleCase(makerModel),
    variant: titleCase(parts.slice(1).join(' ')),
    rawModelLine: rest,
  };
}

function parseRegDate(raw) {
  if (!raw) return { year: null, month: 1 };
  const iso = String(raw).match(/^(\d{4})-(\d{2})/);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]) };
  const dmy = String(raw).match(/^(\d{1,2})[\/\-\s]([A-Za-z]{3}|\d{1,2})[\/\-\s](\d{4})/);
  if (dmy) {
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const month = months[String(dmy[2]).toLowerCase()] || Number(dmy[2]) || 1;
    return { year: Number(dmy[3]), month };
  }
  const yearOnly = String(raw).match(/(19|20)\d{2}/);
  return { year: yearOnly ? Number(yearOnly[0]) : null, month: 1 };
}

function mapRcPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.status === false || payload.success === false) return null;

  const body = payload.data || payload.result || payload.response || payload.vehicle || payload;
  const flat = flatten(body);

  const maker = pick(flat, [
    'brand_name', 'rc_maker_desc', 'maker_description', 'maker_desc', 'maker', 'make',
    'vehicleManufacturerName', 'manufacturer', 'brand', 'oem',
  ]);
  const modelHint = pick(flat, ['model_name', 'modelName']);
  const makerModel = pick(flat, [
    'rc_maker_model', 'maker_model', 'makerModel', 'model', 'vehicle_model',
    'vehicleModel', 'rc_model',
  ]);
  const variantHint = pick(flat, ['variant', 'rc_variant', 'vehicle_variant']);
  const fuel = pick(flat, ['rc_fuel_desc', 'fuel_type', 'fuelType', 'fuel', 'rc_fuel', 'type']);
  const color = pick(flat, ['rc_color', 'vehicle_color', 'colour', 'color', 'vehicleColour']);
  const category = pick(flat, [
    'rc_vh_class_desc', 'rc_body_type_desc', 'vehicle_class', 'vehicle_category',
    'body_type', 'bodyType', 'class',
  ]);
  const regDate = pick(flat, [
    'rc_regn_dt', 'registration_date', 'reg_date', 'regDate', 'registrationDate',
    'rc_purchase_dt', 'manufacturing_date', 'manufacture_month_year', 'vehicle_manufacturing_month_year',
  ]);
  const owners = pick(flat, ['rc_owner_sr', 'owner_count', 'ownerCount', 'owner_number', 'ownerSerialNumber', 'ownership']);
  const rtoName = pick(flat, [
    'rc_registered_at', 'registered_at', 'reg_authority', 'regAuthority',
    'registration_authority', 'rto', 'rto_name', 'office',
  ]);
  const insuranceUpto = pick(flat, ['rc_insurance_upto', 'insurance_upto', 'vehicleInsuranceUpto', 'insuranceUpto']);

  if (!maker && !makerModel && !modelHint) return null;

  const parsed = splitMakeModel(maker, makerModel || modelHint);
  if (modelHint) parsed.model = modelHint;
  let variant = variantHint;
  if (!variant && makerModel && parsed.model) {
    variant = titleCase(
      makerModel.replace(new RegExp(maker, 'i'), '').replace(new RegExp(parsed.model, 'i'), '').trim()
    );
  }
  variant = variant || parsed.variant;
  const when = parseRegDate(regDate);
  if (!parsed.brand || /^object$/i.test(parsed.brand)) return null;
  if (when.year && (when.year < 1985 || when.year > new Date().getFullYear() + 1)) {
    when.year = null;
  }

  return {
    brand: parsed.brand,
    model: parsed.model,
    variant: variant ? titleCase(variant) : '',
    rawModelLine: parsed.rawModelLine || makerModel,
    year: when.year,
    month: when.month,
    fuel: normalizeFuel(fuel),
    transmission: inferTransmission(`${makerModel} ${variant}`, ''),
    bodyType: inferBody(category, parsed.model),
    color: titleCase(color),
    ownership: Number(owners) || 1,
    city: '',
    rto: rtoName,
    insuranceUpto,
    source: 'rapidapi',
  };
}

function publicVehicle(details) {
  return {
    registrationNumber: details.registrationNumber,
    brand: details.brand,
    brandId: details.brandId || null,
    brandLogo: details.brandLogo || '',
    model: details.model,
    modelId: details.modelId || null,
    variant: details.variant || '',
    year: details.year,
    month: details.month || 1,
    fuel: details.fuel,
    transmission: details.transmission,
    bodyType: details.bodyType,
    color: details.color || '',
    ownership: details.ownership || 1,
    city: details.city || '',
    state: details.state || '',
    rto: details.rto || '',
    source: details.source,
    insuranceUpto: details.insuranceUpto || '',
  };
}

function provider() {
  const explicit = String(process.env.RTO_PROVIDER || '').toLowerCase().trim();
  if (explicit) return explicit;
  if (process.env.RAPIDAPI_KEY) return 'rapidapi';
  return '';
}

function configured() {
  const p = provider();
  if (p === 'rapidapi') return Boolean(process.env.RAPIDAPI_KEY || process.env.RTO_API_KEY);
  if (p === 'surepass') return Boolean(process.env.SUREPASS_API_TOKEN || process.env.RTO_API_KEY);
  if (p === 'karza') return Boolean(process.env.KARZA_API_KEY || process.env.RTO_API_KEY);
  if (p === 'zoop') return Boolean((process.env.ZOOP_APP_ID && process.env.ZOOP_API_KEY) || process.env.RTO_API_KEY);
  return Boolean(process.env.RTO_API_URL && (process.env.RAPIDAPI_KEY || process.env.RTO_API_KEY));
}

async function fromRapidApi(reg) {
  const url = process.env.RTO_API_URL || 'https://rto-vehicle-information-india.p.rapidapi.com/getVehicleInfo';
  const key = process.env.RAPIDAPI_KEY || process.env.RTO_API_KEY;
  const host = process.env.RAPIDAPI_HOST || 'rto-vehicle-information-india.p.rapidapi.com';

  const { data } = await axios.post(
    url,
    { vehicle_no: reg },
    {
      timeout: Number(process.env.RTO_API_TIMEOUT || 25000),
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': host,
      },
    }
  );

  const failed =
    data?.status === false ||
    data?.status === 'false' ||
    data?.success === false ||
    data?.success === 'false' ||
    Number(data?.status) === 0;

  if (failed) {
    throw lookupError(data.message || data.msg || 'Please check the vehicle number', 404);
  }

  const mapped = mapRcPayload(data);
  if (!mapped) {
    console.warn('[rto] RapidAPI unrecognized payload', JSON.stringify(sanitizeForLog(data)));
    throw lookupError(
      data?.message || data?.msg || 'No RC details returned for this number. Search manually by brand.',
      404
    );
  }
  return mapped;
}

async function fromProvider(reg) {
  const p = provider() || 'rapidapi';
  try {
    if (p === 'rapidapi' || p === 'generic') return await fromRapidApi(reg);
    throw lookupError(`Unknown RTO_PROVIDER "${p}"`, 500);
  } catch (err) {
    if (err.status && !err.response) throw err;
    const payload = err.response?.data;
    console.warn('[rto] provider failed:', p, err.message, payload || '');
    const status = err.response?.status;
    if (status === 429) {
      const retryAfter = Number(err.response.headers?.['retry-after'] || 60);
      rateLimitedUntil = Date.now() + retryAfter * 1000;
      throw lookupError(
        `RTO provider is rate-limited. Wait ${retryAfter}s, then try once. Do not keep clicking.`,
        429,
        { retryAfter }
      );
    }
    const msg = payload?.message || payload?.msg || payload?.error || err.message;
    throw lookupError(msg || `RC lookup failed (${p})`, status || 502);
  }
}

async function enrichCatalog(details) {
  if (!details?.brand && !details?.rawModelLine) return details;

  const brands = await Brand.find().select('name logo slug').lean();
  const brandNeedle = String(details.brand || '').toLowerCase();
  const line = `${details.brand || ''} ${details.rawModelLine || details.model || ''}`.toLowerCase();

  const brand = brands
    .filter((b) => brandNeedle.includes(b.name.toLowerCase()) || line.includes(b.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length)[0];

  let model = null;
  if (brand) {
    const models = await CarModel.find({ brand: brand._id }).select('name slug').lean();
    model = models
      .filter((m) => line.includes(m.name.toLowerCase()))
      .sort((a, b) => b.name.length - a.name.length)[0];
  }

  let variant = details.variant || '';
  if (model && details.rawModelLine) {
    const leftover = details.rawModelLine.replace(new RegExp(model.name, 'i'), '').trim();
    if (leftover) variant = titleCase(leftover);
  }

  return {
    ...details,
    brand: brand?.name || details.brand,
    brandId: brand?._id || null,
    brandLogo: brand?.logo || '',
    model: model?.name || details.model,
    modelId: model?._id || null,
    variant,
  };
}

async function fetchVehicleDetailsByReg(regNumber) {
  const reg = normalizeReg(regNumber);
  if (reg.length < 6) throw lookupError('Enter a valid registration number', 400);

  const rto = resolveRto(reg);
  const formatted = formatReg(reg);

  if (!configured()) {
    throw lookupError('Live RC lookup is not configured. Add RAPIDAPI_KEY in backend/.env.', 503);
  }

  const cached = cacheGet(reg);
  if (cached) return { ...cached, source: cached.source || 'rapidapi-cache' };

  const waitMs = rateLimitedUntil - Date.now();
  if (waitMs > 0) {
    const secs = Math.ceil(waitMs / 1000);
    throw lookupError(
      `RTO provider is cooling down. Try again in ${secs}s — extra clicks use up the quota.`,
      429,
      { retryAfter: secs }
    );
  }

  const live = await fromProvider(reg);
  if (!live?.brand && !live?.model) {
    throw lookupError('No RC record found for this number. Search manually by brand.', 404);
  }

  const result = publicVehicle(
    await enrichCatalog({
      registrationNumber: formatted,
      ...rto,
      ...live,
      city: live.city || rto.city,
      state: live.state || rto.state,
      rto: live.rto || rto.rto,
    })
  );
  cacheSet(reg, result);
  return result;
}

module.exports = {
  fetchVehicleDetailsByReg,
  normalizeReg,
  formatReg,
  resolveRto,
  configured,
  mapRcPayload,
};
