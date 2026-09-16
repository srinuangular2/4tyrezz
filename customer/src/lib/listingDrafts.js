const SELL_KEY = '4tyrezz.sell.draft';
const VAL_KEY = '4tyrezz.valuation.draft';

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function loadSellDraft() {
  return read(SELL_KEY);
}

export function saveSellDraft(state) {
  if (!state) return;
  const { photoFiles, ...rest } = state;
  write(SELL_KEY, {
    ...rest,
    photoFiles: [],
    photoPreviews: (state.photoPreviews || []).slice(0, 8),
    savedAt: Date.now(),
  });
}

export function clearSellDraft() {
  localStorage.removeItem(SELL_KEY);
}

export function sellDraftReady(draft) {
  return Boolean(draft && draft.brand && draft.model && draft.year);
}

export function loadValuationDraft() {
  return read(VAL_KEY);
}

export function saveValuationDraft(payload) {
  if (!payload?.form?.brand) return;
  write(VAL_KEY, { ...payload, savedAt: Date.now() });
}

export function clearValuationDraft() {
  localStorage.removeItem(VAL_KEY);
}

export function valuationDraftReady(draft) {
  return Boolean(draft?.form?.brand && draft?.form?.model && draft?.form?.year);
}
