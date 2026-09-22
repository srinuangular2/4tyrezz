export const COMPANY_NAME = '4tyrezz';
export const COMPANY_PHONE_DISPLAY = '+91 79939 80559';
export const COMPANY_PHONE_DIGITS = '7993980559';
export const COMPANY_WHATSAPP = '917993980559';

export function digitsOnly(value, max = 10) {
  return String(value || '').replace(/\D/g, '').slice(0, max);
}

export function isIndianMobile(phone) {
  return /^[6-9]\d{9}$/.test(digitsOnly(phone));
}

export function whatsappUrl(text = '') {
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${COMPANY_WHATSAPP}${query}`;
}
