import api from '../api/axios';

const SELL_KEY = '4tyrezz.sell.draft';
const VAL_KEY = '4tyrezz.valuation.draft';
const saveTimers = {};

function hasAuthToken() {
  try {
    return Boolean(localStorage.getItem('token'));
  } catch {
    return false;
  }
}

function takeLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    localStorage.removeItem(key);
    return JSON.parse(raw);
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function sanitizeSell(state) {
  if (!state) return null;
  const { photoFiles, ...rest } = state;
  return {
    ...rest,
    photoFiles: [],
    photoPreviews: (state.photoPreviews || []).slice(0, 8),
    savedAt: Date.now(),
  };
}

async function fetchRemote(kind) {
  if (!hasAuthToken()) return null;
  try {
    const { data } = await api.get(`/drafts/${kind}`);
    return data.data || null;
  } catch {
    return null;
  }
}

async function persistRemote(kind, payload) {
  if (!hasAuthToken() || !payload) return;
  try {
    await api.put(`/drafts/${kind}`, { payload });
  } catch {
    /* stay on in-memory form if API is down */
  }
}

async function deleteRemote(kind) {
  if (!hasAuthToken()) return;
  try {
    await api.delete(`/drafts/${kind}`);
  } catch {
    /* ignore */
  }
}

function debouncePersist(kind, payload) {
  clearTimeout(saveTimers[kind]);
  saveTimers[kind] = setTimeout(() => {
    persistRemote(kind, payload);
  }, 400);
}

export function sellDraftReady(draft) {
  return Boolean(draft && draft.brand && draft.model && draft.year);
}

export function valuationDraftReady(draft) {
  return Boolean(draft?.form?.brand && draft?.form?.model && draft?.form?.year);
}

export async function loadSellDraft() {
  const remote = await fetchRemote('sell');
  const local = takeLocal(SELL_KEY);
  if (sellDraftReady(remote)) return remote;
  if (sellDraftReady(local)) {
    await persistRemote('sell', sanitizeSell(local));
    return local;
  }
  return remote || local || null;
}

export function saveSellDraft(state, { immediate } = {}) {
  const payload = sanitizeSell(state);
  if (!payload) return;
  if (immediate) {
    clearTimeout(saveTimers.sell);
    return persistRemote('sell', payload);
  }
  debouncePersist('sell', payload);
}

export async function clearSellDraft() {
  clearTimeout(saveTimers.sell);
  takeLocal(SELL_KEY);
  await deleteRemote('sell');
}

export async function loadValuationDraft() {
  const remote = await fetchRemote('valuation');
  const local = takeLocal(VAL_KEY);
  if (valuationDraftReady(remote)) return remote;
  if (valuationDraftReady(local)) {
    await persistRemote('valuation', { ...local, savedAt: Date.now() });
    return local;
  }
  return remote || local || null;
}

export function saveValuationDraft(payload, { immediate } = {}) {
  if (!payload?.form?.brand) return;
  const next = { ...payload, savedAt: Date.now() };
  if (immediate) {
    clearTimeout(saveTimers.valuation);
    return persistRemote('valuation', next);
  }
  debouncePersist('valuation', next);
}

export async function clearValuationDraft() {
  clearTimeout(saveTimers.valuation);
  takeLocal(VAL_KEY);
  await deleteRemote('valuation');
}
