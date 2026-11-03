export const CONDITION_PILLS = [
  { id: 'accident-free', label: 'Accident-free' },
  { id: 'service-history', label: 'Service history available' },
  { id: 'minor-scratches', label: 'Minor scratches' },
  { id: 'active-insurance', label: 'Active insurance' },
];

export const KM_PRESETS = [
  { label: '<20k', value: 15000 },
  { label: '20k–50k', value: 35000 },
  { label: '50k–80k', value: 65000 },
  { label: '80k+', value: 95000 },
];

export const OWNER_OPTIONS = [
  { value: 1, label: '1st Owner' },
  { value: 2, label: '2nd Owner' },
  { value: 3, label: '3rd Owner' },
  { value: 4, label: '4th+ Owner' },
];

export const HUBS = [
  { id: 'hyd-hitec', city: 'Hyderabad', name: 'HITEC City Hub' },
  { id: 'hyd-banjara', city: 'Hyderabad', name: 'Banjara Hills Hub' },
  { id: 'blr-koram', city: 'Bengaluru', name: 'Koramangala Hub' },
  { id: 'mum-andheri', city: 'Mumbai', name: 'Andheri Hub' },
  { id: 'del-saket', city: 'Delhi', name: 'Saket Hub' },
];

export function initialSellCarState() {
  return {
    step: 1,
    identifyMode: 'plate',
    manualPhase: 'brand',
    plate: '',
    lookupStatus: 'idle',
    lookupSource: '',
    verified: false,
    editManual: false,
    brand: '',
    brandId: '',
    brandLogo: '',
    model: '',
    modelId: '',
    variant: '',
    year: '',
    month: 1,
    fuel: '',
    transmission: '',
    bodyType: '',
    city: '',
    state: '',
    rto: '',
    color: '',
    insuranceUpto: '',
    kmDriven: 35000,
    ownership: 1,
    conditions: ['accident-free'],
    inspectionType: 'home',
    hubId: '',
    inspectionDate: '',
    inspectionSlot: '',
    intent: 'sell',
    expectedPrice: '',
    photoFiles: [],
    photoPreviews: [],
    email: '',
    name: '',
    phone: '',
    otpVerified: false,
    valuation: null,
    done: false,
  };
}

export function applyLookup(state, details) {
  return {
    ...state,
    lookupStatus: 'success',
    lookupSource: details.source || 'registry',
    verified: true,
    editManual: false,
    plate: details.registrationNumber || state.plate,
    brand: details.brand || '',
    brandId: details.brandId || '',
    brandLogo: details.brandLogo || '',
    model: details.model || '',
    modelId: details.modelId || '',
    variant: details.variant || '',
    year: details.year || state.year,
    month: details.month || 1,
    fuel: details.fuel || 'Petrol',
    transmission: details.transmission || 'Manual',
    bodyType: details.bodyType || 'Hatchback',
    city: details.city || state.city,
    state: details.state || '',
    rto: details.rto || '',
    color: details.color || '',
    insuranceUpto: details.insuranceUpto || '',
    ownership: details.ownership || state.ownership,
  };
}

export function conditionScoreFromPills(conditions = []) {
  let score = 7;
  if (conditions.includes('accident-free')) score += 1;
  if (conditions.includes('service-history')) score += 1;
  if (conditions.includes('minor-scratches')) score -= 1;
  if (conditions.includes('active-insurance')) score += 0.5;
  return Math.min(10, Math.max(1, Math.round(score)));
}

export function vehicleReady(state) {
  return Boolean(state.brand && state.model && state.year);
}

const PLATE_CITY = {
  TS07: 'Hyderabad',
  TS08: 'Hyderabad',
  TS09: 'Hyderabad',
  TS10: 'Hyderabad',
  TS11: 'Hyderabad',
  TS12: 'Hyderabad',
  TS13: 'Hyderabad',
  KA01: 'Bengaluru',
  KA02: 'Bengaluru',
  KA03: 'Bengaluru',
  KA04: 'Bengaluru',
  KA05: 'Bengaluru',
  KA51: 'Bengaluru',
  MH01: 'Mumbai',
  MH02: 'Mumbai',
  MH03: 'Mumbai',
  MH04: 'Thane',
  MH12: 'Pune',
  MH14: 'Pune',
  DL01: 'Delhi',
  DL02: 'Delhi',
  DL03: 'Delhi',
  DL04: 'Delhi',
  TN01: 'Chennai',
  TN02: 'Chennai',
  TN07: 'Chennai',
  TN09: 'Chennai',
  AP31: 'Visakhapatnam',
  GJ01: 'Ahmedabad',
  RJ14: 'Jaipur',
};

const STATE_CITY = {
  TS: 'Hyderabad',
  TG: 'Hyderabad',
  KA: 'Bengaluru',
  MH: 'Mumbai',
  DL: 'Delhi',
  TN: 'Chennai',
  AP: 'Visakhapatnam',
  GJ: 'Ahmedabad',
  RJ: 'Jaipur',
  KL: 'Kochi',
  WB: 'Kolkata',
  UP: 'Lucknow',
  HR: 'Gurugram',
  PB: 'Chandigarh',
};

/** City implied by an Indian plate prefix, e.g. TS08 → Hyderabad. */
export function cityFromPlate(plate = '') {
  const c = compactReg(plate);
  if (c.length < 4) return '';
  const keys = Object.keys(PLATE_CITY).sort((a, b) => b.length - a.length);
  const hit = keys.find((key) => c.startsWith(key));
  if (hit) return PLATE_CITY[hit];
  return STATE_CITY[c.slice(0, 2)] || '';
}

export function matchCityName(guess, cities = []) {
  const want = String(guess || '').trim().toLowerCase();
  if (!want) return '';
  const names = (cities || []).map((city) => city?.name).filter(Boolean);
  return names.find((name) => name.toLowerCase() === want)
    || names.find((name) => name.toLowerCase().startsWith(want))
    || '';
}

export function conditionMessage(state) {
  const plateMsg = plateError(state.plate);
  if (plateMsg) return plateMsg;
  const variantMsg = variantError(state.variant);
  if (variantMsg) return variantMsg;
  if (!state.city) return 'Select the city where the car is';
  if (!(Number(state.ownership) > 0)) return 'Select how many owners';
  return '';
}

export function compactReg(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Indian RC: TS09AB1234 or Bharat series 22BH1234AA */
export function plateError(value = '') {
  const c = compactReg(value);
  if (!c) return 'Enter the registration number';
  if (c.length < 8) return 'Enter a full RC number, e.g. TS 09 AB 1234';
  const standard = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  const bharat = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  if (!standard.test(c) && !bharat.test(c)) {
    return 'Use a valid Indian RC format, e.g. TS 09 AB 1234';
  }
  return '';
}

export function variantError(value = '') {
  const v = String(value || '').trim();
  if (!v) return 'Enter the variant, e.g. SX (O)';
  if (v.length < 2) return 'Variant is too short';
  if (v.length > 40) return 'Variant is too long';
  if (!/[A-Za-z]/.test(v)) return 'Variant must include letters, not only numbers';
  if (!/^[A-Za-z0-9][A-Za-z0-9 .()/+-]*$/.test(v)) {
    return 'Use letters, numbers and common symbols only';
  }
  return '';
}

export function hasPhotos(state) {
  return (state.photoFiles || []).length >= 1 || (state.photoPreviews || []).length >= 1;
}

export function conditionReady(state) {
  return Boolean(
    state.city
    && !plateError(state.plate)
    && !variantError(state.variant)
    && Number(state.ownership) > 0
  );
}

export function sellStateFromValuation(form = {}, result = {}) {
  const valuation = result.valuation || {};
  const fair = valuation.fairMarketValue || result.estimate || '';
  const minPrice = valuation.estimatedMinPrice || result.minPrice || '';
  const maxPrice = valuation.estimatedMaxPrice || result.maxPrice || '';
  return {
    ...initialSellCarState(),
    identifyMode: form.plate ? 'plate' : 'manual',
    lookupStatus: form.brand ? 'success' : 'idle',
    verified: Boolean(form.brand && form.plate),
    plate: form.plate || '',
    brand: form.brand || '',
    model: form.model || '',
    variant: form.variant || '',
    year: form.year || '',
    fuel: form.fuel || '',
    transmission: form.transmission || '',
    bodyType: form.bodyType || '',
    city: form.city || '',
    kmDriven: Number(form.kmDriven) || 35000,
    ownership: Number(form.ownership) || 1,
    expectedPrice: fair || '',
    inspectionDate: new Date().toISOString().slice(0, 10),
    inspectionSlot: '9:00 AM – 11:00 AM',
    step: 4,
    fromValuation: true,
    valuation: fair
      ? {
          estimate: fair,
          minPrice,
          maxPrice,
          id: result.id || '',
          source: result.source || valuation.source || 'smartprice',
        }
      : null,
  };
}

export function sellStateFromRequest(row = {}, { photoOnly = false } = {}) {
  const missingCore = !row.variant || !row.plate || !row.city || !row.kmDriven;
  const missingPrice = !(Number(row.expectedPrice) > 0) || !row.inspectionDate || !row.inspectionSlot;
  let step = 4;
  if (photoOnly) step = 4;
  else if (missingCore) step = 2;
  else if (missingPrice) step = 3;
  return {
    ...initialSellCarState(),
    enquiryId: row.id,
    photoOnly: Boolean(photoOnly),
    step,
    identifyMode: row.plate ? 'plate' : 'manual',
    verified: Boolean(row.brand && row.plate),
    plate: row.plate || '',
    brand: row.brand || '',
    model: row.model || '',
    variant: row.variant || '',
    year: row.year || '',
    fuel: row.fuel || '',
    transmission: row.transmission || '',
    city: row.city || '',
    kmDriven: Number(row.kmDriven) || 35000,
    ownership: Number(row.ownership) || 1,
    expectedPrice: row.expectedPrice || '',
    inspectionDate: row.inspectionDate || new Date().toISOString().slice(0, 10),
    inspectionSlot: row.inspectionSlot || '9:00 AM – 11:00 AM',
    inspectionType: row.inspectionType || 'home',
    valuation: row.estimatePrice
      ? { estimate: row.estimatePrice, minPrice: row.minPrice, maxPrice: row.maxPrice }
      : null,
  };
}

export function resumeSellStep(saved) {
  const step = Number(saved?.step);
  if (step >= 1 && step <= 5) return step;
  return vehicleReady(saved) ? 2 : 1;
}

export function fileToPreview(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1200;
      let w = img.width;
      let h = img.height;
      if (w > max || h > max) {
        const scale = Math.min(max / w, max / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ name: file.name, type: 'image/jpeg', dataUrl: canvas.toDataURL('image/jpeg', 0.72) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

export function filesFromPreviews(previews = []) {
  return previews.map((preview, i) => {
    const dataUrl = preview.dataUrl || '';
    const [header, b64] = dataUrl.split(',');
    const mime = preview.type || (header.match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const binary = atob(b64 || '');
    const bytes = new Uint8Array(binary.length);
    for (let n = 0; n < binary.length; n += 1) bytes[n] = binary.charCodeAt(n);
    return new File([bytes], preview.name || `photo-${i + 1}.jpg`, { type: mime });
  });
}

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthLabel(n) {
  return MONTHS[Math.max(1, Number(n) || 1) - 1];
}
