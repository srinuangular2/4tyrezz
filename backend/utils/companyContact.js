function digits(value, fallback) {
  const next = String(value || '').replace(/\D/g, '');
  return next || fallback;
}

function companyPhone() {
  return digits(process.env.COMPANY_PHONE || process.env.SUPPORT_PHONE, '7993980559');
}

function companyWhatsapp() {
  const raw = digits(process.env.COMPANY_WHATSAPP || process.env.MSG91_WHATSAPP_NUMBER, companyPhone());
  return raw.startsWith('91') ? raw : `91${raw}`;
}

function companyDealerCard() {
  return {
    name: '4tyrezz',
    phone: companyPhone(),
    whatsapp: companyWhatsapp(),
    address: '',
    coordinates: null,
    verifiedStatus: true,
  };
}

module.exports = {
  companyPhone,
  companyWhatsapp,
  companyDealerCard,
};
