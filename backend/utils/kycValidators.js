const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const PAN_ENTITY = new Set(['A', 'B', 'C', 'F', 'G', 'H', 'L', 'J', 'P', 'T', 'K']);
const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BLOCKED_PAN = new Set(['ABCDE1234F', 'AAAAA0000A', 'AAAAA1234A', 'XXXXX0000X', 'PPPPP0000P']);
const BLOCKED_GSTIN = new Set(['22AAAAA0000A1Z5', '27AAAAA0000A1Z5', '07AAAAA0000A1Z5', '29AAAAA0000A1Z5']);

function normalizePan(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

function normalizeGstin(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
}

function normalizeMobile(value = '') {
  return String(value).replace(/\D/g, '').slice(-10);
}

function gstChecksumValid(gstin) {
  if (!gstin || gstin.length !== 15) return false;
  let factor = 1;
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const code = GST_CHARS.indexOf(gstin[i]);
    if (code < 0) return false;
    let product = factor * code;
    factor = factor === 1 ? 2 : 1;
    product = Math.floor(product / GST_CHARS.length) + (product % GST_CHARS.length);
    sum += product;
  }
  const check = (GST_CHARS.length - (sum % GST_CHARS.length)) % GST_CHARS.length;
  return GST_CHARS[check] === gstin[14];
}

function gstStateCodeValid(gstin) {
  const code = Number(gstin.slice(0, 2));
  return code >= 1 && code <= 38;
}

function validatePan(raw) {
  const pan = normalizePan(raw);
  if (!pan) return { ok: false, value: '', message: 'PAN is required' };
  if (pan.length < 10) return { ok: false, value: pan, message: 'PAN must be 10 characters (ABCDE1234F)' };
  if (!PAN_REGEX.test(pan)) return { ok: false, value: pan, message: 'PAN must match AAAAA9999A' };
  if (!PAN_ENTITY.has(pan[3])) {
    return { ok: false, value: pan, message: '4th character of PAN is not a valid entity type' };
  }
  if (BLOCKED_PAN.has(pan) || /^(.)\1{4}/.test(pan)) {
    return { ok: false, value: pan, message: 'This PAN looks like a placeholder. Enter the official number.' };
  }
  return { ok: true, value: pan, message: '' };
}

function validateGstin(raw, pan) {
  const gstin = normalizeGstin(raw);
  if (!gstin) return { ok: false, value: '', message: 'GSTIN is required' };
  if (gstin.length < 15) return { ok: false, value: gstin, message: 'GSTIN must be 15 characters' };
  if (!GSTIN_REGEX.test(gstin)) {
    return { ok: false, value: gstin, message: 'GSTIN must match 99AAAAA9999A9Z9' };
  }
  if (!gstStateCodeValid(gstin)) {
    return { ok: false, value: gstin, message: 'GSTIN state code must be between 01 and 38' };
  }
  if (!gstChecksumValid(gstin)) {
    return { ok: false, value: gstin, message: 'GSTIN checksum is invalid' };
  }
  if (BLOCKED_GSTIN.has(gstin) || gstin.includes('AAAAA0000A')) {
    return { ok: false, value: gstin, message: 'This GSTIN looks like a placeholder. Enter the official number.' };
  }
  const panValue = pan ? normalizePan(pan) : '';
  if (panValue && gstin.slice(2, 12) !== panValue) {
    return { ok: false, value: gstin, message: 'GSTIN must contain the same PAN in characters 3–12' };
  }
  return { ok: true, value: gstin, message: '' };
}

function validateMobile(raw) {
  const mobile = normalizeMobile(raw);
  if (!mobile) return { ok: false, value: '', message: 'Mobile number is required' };
  if (!MOBILE_REGEX.test(mobile)) {
    return { ok: false, value: mobile, message: 'Enter a valid 10-digit Indian mobile starting with 6–9' };
  }
  return { ok: true, value: mobile, message: '' };
}

function validateEmail(raw) {
  const email = String(raw || '').trim().toLowerCase();
  if (!email) return { ok: false, value: '', message: 'Email is required' };
  if (!EMAIL_REGEX.test(email)) return { ok: false, value: email, message: 'Enter a valid work email address' };
  return { ok: true, value: email, message: '' };
}

function validatePincode(raw) {
  const pincode = String(raw || '').replace(/\D/g, '').slice(0, 6);
  if (!PINCODE_REGEX.test(pincode)) return { ok: false, value: pincode, message: 'Enter a valid 6-digit pincode' };
  return { ok: true, value: pincode, message: '' };
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function validateIfsc(raw) {
  const ifsc = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!ifsc) return { ok: false, value: '', message: 'IFSC is required' };
  if (!IFSC_REGEX.test(ifsc)) return { ok: false, value: ifsc, message: 'IFSC must match ABCD0123456' };
  return { ok: true, value: ifsc, message: '' };
}

function validateBankAccount(raw) {
  const account = String(raw || '').replace(/\s/g, '');
  if (!account) return { ok: false, value: '', message: 'Account number is required' };
  if (!/^\d{9,18}$/.test(account)) {
    return { ok: false, value: account, message: 'Enter a 9–18 digit bank account number' };
  }
  return { ok: true, value: account, message: '' };
}

module.exports = {
  PAN_REGEX,
  GSTIN_REGEX,
  MOBILE_REGEX,
  EMAIL_REGEX,
  PINCODE_REGEX,
  IFSC_REGEX,
  normalizePan,
  normalizeGstin,
  normalizeMobile,
  validatePan,
  validateGstin,
  validateMobile,
  validateEmail,
  validatePincode,
  validateIfsc,
  validateBankAccount,
};
