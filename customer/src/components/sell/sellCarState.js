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

export function conditionReady(state) {
  return Boolean(
    state.city
    && String(state.plate || '').replace(/\s/g, '').length >= 8
    && (state.photoFiles || []).length >= 1
    && String(state.variant || '').trim()
    && Number(state.ownership) > 0
  );
}

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthLabel(n) {
  return MONTHS[Math.max(1, Number(n) || 1) - 1];
}
