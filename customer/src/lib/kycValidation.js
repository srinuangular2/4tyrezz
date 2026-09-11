export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const MOBILE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const PAN_ENTITY = new Set(['A', 'B', 'C', 'F', 'G', 'H', 'L', 'J', 'P', 'T', 'K']);
const BLOCKED_PAN = new Set(['ABCDE1234F', 'AAAAA0000A', 'AAAAA1234A', 'XXXXX0000X']);
const BLOCKED_GST = new Set(['22AAAAA0000A1Z5', '27AAAAA0000A1Z5', '07AAAAA0000A1Z5']);

export function normalizePan(v = '') {
  return String(v).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}
export function normalizeGstin(v = '') {
  return String(v).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
}
export function normalizeMobile(v = '') {
  return String(v).replace(/\D/g, '').slice(0, 10);
}

export function panError(raw) {
  if (!raw) return '';
  const pan = normalizePan(raw);
  if (pan.length < 10) return 'PAN must be 10 characters';
  if (!PAN_REGEX.test(pan)) return 'PAN must match five letters, four digits, one letter';
  if (!PAN_ENTITY.has(pan[3])) return '4th character of PAN is not a valid entity type';
  if (BLOCKED_PAN.has(pan)) return 'This PAN looks like a placeholder. Enter the official number.';
  return '';
}

export function gstinError(raw, pan) {
  if (!raw) return '';
  const gstin = normalizeGstin(raw);
  if (gstin.length < 15) return 'GSTIN must be 15 characters';
  if (!GSTIN_REGEX.test(gstin)) return 'GSTIN structure is invalid';
  const state = Number(gstin.slice(0, 2));
  if (state < 1 || state > 38) return 'GSTIN state code must be 01–38';
  if (BLOCKED_GST.has(gstin) || gstin.includes('AAAAA0000A')) return 'This GSTIN looks like a placeholder. Enter the official number.';
  const p = pan ? normalizePan(pan) : '';
  if (p.length === 10 && gstin.slice(2, 12) !== p) return 'GSTIN must contain the same PAN in characters 3–12';
  return '';
}

export function mobileError(raw) {
  if (!raw) return '';
  const m = normalizeMobile(raw);
  if (!MOBILE_REGEX.test(m)) return 'Enter a 10-digit Indian mobile starting with 6–9';
  return '';
}

export function emailError(raw) {
  if (!raw) return '';
  if (!EMAIL_REGEX.test(String(raw).trim())) return 'Enter a valid email address';
  return '';
}

export function passwordError(raw) {
  if (!raw) return '';
  if (String(raw).length < 8) return 'Password must be at least 8 characters';
  return '';
}

export function passwordStrength(raw) {
  const value = String(raw || '');
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return {
    score,
    label: score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : 'Strong',
    percent: Math.min(100, score * 20),
  };
}

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function normalizeIfsc(v = '') {
  return String(v).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
}

export function ifscError(raw) {
  if (!raw) return '';
  const ifsc = normalizeIfsc(raw);
  if (!IFSC_REGEX.test(ifsc)) return 'IFSC must match ABCD0123456';
  return '';
}

export function bankAccountError(raw) {
  if (!raw) return '';
  const acc = String(raw).replace(/\s/g, '');
  if (!/^\d{9,18}$/.test(acc)) return 'Enter a 9–18 digit account number';
  return '';
}

export const inputClass =
  'w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-extrabold outline-none focus:border-[#3083ff] focus:ring-4 focus:ring-[#3083ff]/10 bg-white disabled:bg-slate-50';
