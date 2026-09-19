import api from '../api/axios';

export function normalizeReg(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Progressive Indian plate formatter: TS09AB1234 → TS 09 AB 1234 */
export function formatPlateInput(value = '') {
  const c = normalizeReg(value).slice(0, 10);
  if (c.length <= 2) return c;
  if (c.length <= 4) return `${c.slice(0, 2)} ${c.slice(2)}`;
  const rest = c.slice(4);
  const letterEnd = rest.search(/\d/);
  if (letterEnd === -1) return `${c.slice(0, 2)} ${c.slice(2, 4)} ${rest}`.trim();
  const series = rest.slice(0, letterEnd) || rest.slice(0, 2);
  const digits = rest.slice(letterEnd);
  return `${c.slice(0, 2)} ${c.slice(2, 4)} ${series} ${digits}`.trim();
}

export async function fetchVehicleDetailsByReg(regNumber) {
  const reg = normalizeReg(regNumber);
  try {
    const { data } = await api.post('/vahan/lookup', { reg });
    return data.data;
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 405) {
      const { data } = await api.get('/vahan/lookup', { params: { reg } });
      return data.data;
    }
    if (err.response?.status === 404) {
      const { data } = await api.get('/meta/rto-lookup', { params: { reg } });
      return data.data;
    }
    throw err;
  }
}
