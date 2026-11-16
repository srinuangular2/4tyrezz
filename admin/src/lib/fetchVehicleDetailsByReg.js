import api from '../api/axios';

export function normalizeReg(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Progressive Indian plate formatter: TS09AB1234 → TS 09 AB 1234 */
export function formatPlateInput(value = '') {
  const c = normalizeReg(value);
  if (!c) return '';

  // Bharat series: 22BH1234AA → 22 BH 1234 AA
  if (/^\d/.test(c)) {
    const raw = c.slice(0, 10);
    const year = raw.slice(0, 2);
    let rest = raw.slice(2);
    let code = '';
    while (code.length < 2 && /^[A-Z]/.test(rest)) {
      code += rest[0];
      rest = rest.slice(1);
    }
    let num = '';
    while (num.length < 4 && /^\d/.test(rest)) {
      num += rest[0];
      rest = rest.slice(1);
    }
    let suffix = '';
    while (suffix.length < 2 && /^[A-Z]/.test(rest)) {
      suffix += rest[0];
      rest = rest.slice(1);
    }
    return [year, code, num, suffix].filter(Boolean).join(' ');
  }

  // State plate: AP 39 S 1234, AP 39 SA 1234, or digits before the series is typed.
  const raw = c.slice(0, 11);
  let i = 0;
  let state = '';
  while (i < raw.length && state.length < 2 && /[A-Z]/.test(raw[i])) state += raw[i++];
  let rto = '';
  while (i < raw.length && rto.length < 2 && /\d/.test(raw[i])) rto += raw[i++];
  const rest = raw.slice(i);
  let series = rest;
  let num = '';
  const tail = rest.match(/^(.*?)(\d+)$/);
  if (tail) {
    const head = tail[1];
    const digits = tail[2];
    if (!head) {
      num = digits.slice(0, 4);
      series = '';
    } else if (digits.length <= 4) {
      series = head;
      num = digits;
    } else {
      series = head + digits.slice(0, -4);
      num = digits.slice(-4);
    }
  }
  return [state, rto, series, num].filter(Boolean).join(' ');
}

/** Keep the caret on the character the user just typed, not on an inserted space. */
export function commitPlateInput(event, previous, apply) {
  const el = event.target;
  let raw = el.value;
  let start = el.selectionStart ?? raw.length;
  const prev = normalizeReg(previous || '');
  const next = normalizeReg(raw);
  if (next === prev && String(previous || '').length > raw.length) {
    const sigAt = normalizeReg(String(previous).slice(0, start + 1)).length;
    raw = prev.slice(0, Math.max(0, sigAt - 1)) + prev.slice(sigAt);
    start = Math.max(0, sigAt - 1);
  }
  const value = formatPlateInput(raw);
  const sig = normalizeReg(raw.slice(0, start)).length;
  let caret = 0;
  let seen = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (/[A-Z0-9]/.test(value[i])) seen += 1;
    caret = i + 1;
    if (seen >= sig) break;
  }
  if (!sig) caret = 0;
  apply(value);
  requestAnimationFrame(() => {
    if (!el.isConnected) return;
    const pos = Math.min(caret, el.value.length);
    el.setSelectionRange(pos, pos);
  });
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
