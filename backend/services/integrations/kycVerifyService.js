const axios = require('axios');
const { validatePan, validateGstin } = require('../../utils/kycValidators');

function provider() {
  return String(process.env.KYC_PROVIDER || 'sandbox').toLowerCase();
}

async function lookupPanExternal(pan) {
  const url = process.env.KYC_PAN_API_URL;
  const key = process.env.KYC_API_KEY || process.env.KARZA_API_KEY || process.env.SUREPASS_API_KEY || process.env.RAPIDAPI_KEY;
  if (!url || !key) return null;
  try {
    const { data } = await axios.post(
      url,
      { pan, panNumber: pan },
      {
        timeout: Number(process.env.KYC_API_TIMEOUT || 8000),
        headers: {
          Authorization: `Bearer ${key}`,
          'x-api-key': key,
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': process.env.KYC_PAN_API_HOST || '',
        },
      }
    );
    const status = data.status || data.result || data.data?.status || data.valid;
    const valid = status === true || status === 'VALID' || status === 'Active' || data.success === true;
    return {
      provider: provider(),
      verified: Boolean(valid),
      name: data.name || data.data?.name || data.result?.name || '',
      rawStatus: status || 'unknown',
    };
  } catch (err) {
    console.warn('[kyc] PAN lookup skipped:', err.message);
    return { provider: provider(), verified: false, error: err.message };
  }
}

async function lookupGstinExternal(gstin) {
  const url = process.env.KYC_GST_API_URL;
  const key = process.env.KYC_API_KEY || process.env.KARZA_API_KEY || process.env.SUREPASS_API_KEY || process.env.RAPIDAPI_KEY;
  if (!url || !key) return null;
  try {
    const { data } = await axios.post(
      url,
      { gstin, gstNumber: gstin },
      {
        timeout: Number(process.env.KYC_API_TIMEOUT || 8000),
        headers: {
          Authorization: `Bearer ${key}`,
          'x-api-key': key,
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': process.env.KYC_GST_API_HOST || '',
        },
      }
    );
    const status = String(data.status || data.data?.sts || data.data?.status || data.gstinStatus || '').toUpperCase();
    const verified = ['ACTIVE', 'VALID', 'YES', 'TRUE'].includes(status) || data.success === true || data.valid === true;
    return {
      provider: provider(),
      verified,
      legalName: data.legalName || data.data?.lgnm || data.data?.legalName || '',
      tradeName: data.tradeName || data.data?.tradeNam || '',
      state: data.state || data.data?.stj || '',
      rawStatus: status || 'unknown',
    };
  } catch (err) {
    console.warn('[kyc] GST lookup skipped:', err.message);
    return { provider: provider(), verified: false, error: err.message };
  }
}

async function verifyPan(raw) {
  const format = validatePan(raw);
  if (!format.ok) return { ...format, verified: false, source: 'regex' };
  const external = await lookupPanExternal(format.value);
  if (external) {
    return {
      ok: external.verified,
      verified: external.verified,
      value: format.value,
      message: external.verified ? 'PAN verified' : external.error || 'PAN could not be verified with the registry',
      source: external.provider,
      details: external,
    };
  }
  return {
    ok: true,
    verified: true,
    value: format.value,
    message: 'PAN format and checksum accepted (sandbox)',
    source: 'sandbox',
  };
}

async function verifyGstin(raw, pan) {
  const format = validateGstin(raw, pan);
  if (!format.ok) return { ...format, verified: false, source: 'regex' };
  const external = await lookupGstinExternal(format.value);
  if (external) {
    return {
      ok: external.verified,
      verified: external.verified,
      value: format.value,
      message: external.verified ? 'GSTIN verified' : external.error || 'GSTIN could not be verified with the registry',
      source: external.provider,
      details: external,
    };
  }
  return {
    ok: true,
    verified: true,
    value: format.value,
    message: 'GSTIN format, state code and checksum accepted (sandbox)',
    source: 'sandbox',
  };
}

async function verifyKycDocuments({ panNumber, gstNumber }) {
  const [pan, gst] = await Promise.all([
    panNumber ? verifyPan(panNumber) : Promise.resolve(null),
    gstNumber ? verifyGstin(gstNumber, panNumber) : Promise.resolve(null),
  ]);
  return { pan, gst, success: Boolean((!pan || pan.ok) && (!gst || gst.ok)) };
}

module.exports = { verifyPan, verifyGstin, verifyKycDocuments };
