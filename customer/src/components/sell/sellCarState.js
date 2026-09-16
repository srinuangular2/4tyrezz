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
    && hasPhotos(state)
    && !variantError(state.variant)
    && Number(state.ownership) > 0
  );
}

export function resumeSellStep(saved) {
  const step = Number(saved?.step);
  if (step >= 1 && step <= 4) return step;
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
