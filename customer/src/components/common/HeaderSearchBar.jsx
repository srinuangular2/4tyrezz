import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Close, Search } from '../icons';
import { formatINR } from '../PageShell';
import { mediaUrl } from '../../pages/profile/hubUtils';

export const BUY_CARS_PATH = '/buy-cars';
const RECENT_KEY = '4tyrezz:recent-searches';
const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

function listingHref(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== '') sp.set(key, String(value).trim());
  });
  const qs = sp.toString();
  return qs ? `${BUY_CARS_PATH}?${qs}` : BUY_CARS_PATH;
}

function readRecent() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((row) => row && row.label).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function writeRecent(rows) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(rows.slice(0, 8)));
}

function cityParam(location) {
  const raw = String(location || '').trim();
  if (!raw) return '';
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
}

function BrandMark({ name, logo }) {
  const src = logo ? mediaUrl(logo) : '';
  if (src) {
    return <img src={src} alt="" className="w-7 h-7 object-contain rounded-md bg-white" />;
  }
  return (
    <span className="w-7 h-7 rounded-md bg-slate-100 text-[#3083ff] text-[11px] font-black flex items-center justify-center">
      {(name || '?')[0].toUpperCase()}
    </span>
  );
}

export default function HeaderSearchBar({
  city = '',
  variant = 'inline',
  open = true,
  onClose,
  anchorRef,
  autoFocus = false,
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const abortRef = useRef(null);
  const seqRef = useRef(0);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    popularBrands: [],
    popularModels: [],
    popularAreas: [],
    trending: [],
    models: [],
    cars: [],
    intents: [],
    locations: [],
    total: 0,
  });
  const [recent, setRecent] = useState(readRecent);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isModal = variant === 'modal';
  const typing = query.trim().length >= MIN_CHARS;
  const panelOpen = isModal ? open : focused;
  const cityName = cityParam(city);

  const remember = useCallback((entry) => {
    const label = String(entry?.label || entry?.q || '').trim();
    if (!label) return;
    const next = [{ ...entry, label }, ...recent.filter((row) => row.label.toLowerCase() !== label.toLowerCase())];
    setRecent(next);
    writeRecent(next);
  }, [recent]);

  const go = useCallback((params, recentEntry) => {
    const payload = { ...params };
    if (recentEntry) remember(recentEntry);
    setFocused(false);
    onClose?.();
    navigate(listingHref(payload));
  }, [navigate, onClose, remember]);

  const fetchAutocomplete = useCallback(async (q) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++seqRef.current;
    setLoading(true);
    try {
      const { data: json } = await api.get('/cars/autocomplete', {
        params: { q, city: cityName || city },
        signal: controller.signal,
      });
      if (seq !== seqRef.current) return;
      setData({
        popularBrands: json.popularBrands || [],
        popularModels: json.popularModels || [],
        popularAreas: json.popularAreas || [],
        trending: json.trending || [],
        models: json.models || [],
        cars: json.cars || [],
        intents: json.intents || [],
        locations: json.locations || [],
        total: json.total || 0,
      });
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      if (seq !== seqRef.current) return;
      setData((prev) => ({ ...prev, models: [], cars: [], intents: [], total: 0 }));
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, [city, cityName]);

  useEffect(() => {
    if (!panelOpen) return;
    const q = query.trim();
    if (q.length > 0 && q.length < MIN_CHARS) return undefined;
    const timer = setTimeout(() => fetchAutocomplete(q), q.length >= MIN_CHARS ? DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [query, panelOpen, fetchAutocomplete]);

  useEffect(() => {
    if (panelOpen && (autoFocus || isModal)) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [panelOpen, autoFocus, isModal]);

  useEffect(() => {
    if (!isModal || !open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModal, open]);

  const items = useMemo(() => {
    if (typing) {
      return [
        ...(data.locations || []).map((loc) => ({
          type: 'location',
          label: loc.label,
          params: { state: loc.state, city: loc.city, area: loc.area },
          meta: loc,
        })),
        ...data.models.map((m) => ({
          type: 'model',
          label: `${m.brand} ${m.model}`,
          params: { brand: m.brand, model: m.model },
          meta: m,
        })),
        ...data.cars.map((c) => ({
          type: 'car',
          label: c.title,
          href: `/cars/${c.id}`,
          meta: c,
        })),
        ...data.intents.map((intent) => ({
          type: 'intent',
          label: intent.label,
          params: {
            fuel: intent.fuel,
            bodyType: intent.bodyType,
            transmission: intent.transmission,
            maxPrice: intent.maxPrice,
          },
          meta: intent,
        })),
        {
          type: 'viewall',
          label: `View all results (${data.total} cars found)`,
          params: {
            q: query.trim(),
            fuel: data.intents[0]?.fuel,
            bodyType: data.intents[0]?.bodyType,
            transmission: data.intents[0]?.transmission,
          },
        },
      ];
    }
    return [
      ...recent.map((row) => ({ type: 'recent', label: row.label, params: row.params || { q: row.q || row.label }, meta: row })),
      ...(data.popularAreas || []).map((loc) => ({
        type: 'location',
        label: loc.label,
        params: { state: loc.state, city: loc.city, area: loc.area },
        meta: loc,
      })),
      ...data.popularBrands.map((b) => ({ type: 'brand', label: b.name, params: { brand: b.name }, meta: b })),
      ...data.trending.map((row) => ({
        type: 'trend',
        label: row.label,
        params: {
          q: row.q,
          brand: row.brand,
          model: row.model,
          fuel: row.fuel,
          bodyType: row.bodyType,
          transmission: row.transmission,
          maxPrice: row.maxPrice,
        },
        meta: row,
      })),
    ];
  }, [typing, data, recent, query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, typing, panelOpen]);

  const activate = (item) => {
    if (!item) return;
    if (item.href) {
      remember({ label: item.label, params: { q: item.label } });
      setFocused(false);
      onClose?.();
      navigate(item.href);
      return;
    }
    const params = { ...item.params };
    Object.keys(params).forEach((key) => {
      if (params[key] == null || params[key] === '') delete params[key];
    });
    go(params, { label: item.label, params, q: params.q || item.label });
  };

  const submitQuery = () => {
    const q = query.trim();
    if (!q) {
      go({}, null);
      return;
    }
    const intent = data.intents?.[0];
    go(
      {
        q,
        fuel: intent?.fuel,
        bodyType: intent?.bodyType,
        transmission: intent?.transmission,
      },
      { label: q, q, params: { q } }
    );
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setFocused(false);
      onClose?.();
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!panelOpen) setFocused(true);
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) activate(items[activeIndex]);
      else submitQuery();
    }
  };

  useEffect(() => {
    if (isModal) return undefined;
    const onDown = (event) => {
      const root = panelRef.current;
      const anchor = anchorRef?.current;
      if (root?.contains(event.target) || anchor?.contains(event.target) || inputRef.current?.contains(event.target)) return;
      setFocused(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [anchorRef, isModal]);

  const dropdown = panelOpen ? (
    <div
      ref={panelRef}
      id="header-search-dropdown"
      role="listbox"
      className={
        isModal
          ? 'flex-1 overflow-y-auto px-4 pb-6'
          : 'absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[80] max-h-[min(72vh,560px)] overflow-y-auto'
      }
    >
      {loading && (
        <p className="px-4 py-3 text-xs font-bold text-slate-400">Searching live inventory…</p>
      )}

      {!typing && (
        <div className="p-4 space-y-5">
          {recent.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-400">Recent searches</h4>
                <button
                  type="button"
                  className="text-[11px] font-bold text-[#3083ff]"
                  onClick={() => {
                    setRecent([]);
                    writeRecent([]);
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((row) => {
                  const idx = items.findIndex((item) => item.type === 'recent' && item.label === row.label);
                  return (
                    <button
                      key={`r-${row.label}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === idx}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        activeIndex === idx ? 'border-[#3083ff] bg-blue-50 text-[#3083ff]' : 'border-slate-200 text-slate-700 hover:border-[#3083ff]'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => activate(items[idx])}
                    >
                      {row.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {(data.popularAreas || []).length > 0 && (
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-2">Popular localities</h4>
              <div className="flex flex-wrap gap-2">
                {data.popularAreas.map((loc) => {
                  const idx = items.findIndex((item) => item.type === 'location' && item.label === loc.label);
                  return (
                    <button
                      key={loc.label}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === idx}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        activeIndex === idx ? 'border-[#3083ff] bg-blue-50 text-[#3083ff]' : 'border-slate-200 text-slate-700 hover:border-[#3083ff]'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => activate(items[idx])}
                    >
                      📍 {loc.label}{loc.count ? ` (${loc.count})` : ''}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {data.popularBrands.length > 0 && (
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-2">Popular brands</h4>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {data.popularBrands.map((b) => {
                  const idx = items.findIndex((item) => item.type === 'brand' && item.label === b.name);
                  return (
                    <button
                      key={b.id || b.slug || b.name}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === idx}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 ${
                        activeIndex === idx ? 'border-[#3083ff] bg-blue-50' : 'border-slate-100 hover:border-[#3083ff]'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => activate(items[idx])}
                    >
                      <BrandMark name={b.name} logo={b.logo} />
                      <span className="text-[10px] font-black text-slate-700 truncate w-full text-center">{b.name}</span>
                      <span className="text-[9px] font-bold text-slate-400">{b.count} cars</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {data.trending.length > 0 && (
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-2">Trending searches</h4>
              <div className="flex flex-wrap gap-2">
                {data.trending.map((row) => {
                  const idx = items.findIndex((item) => item.type === 'trend' && item.label === row.label);
                  return (
                    <button
                      key={row.label}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === idx}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        activeIndex === idx ? 'bg-[#3083ff] text-white' : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#3083ff]'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => activate(items[idx])}
                    >
                      {row.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {!loading && !data.popularBrands.length && !data.trending.length && !recent.length && (
            <p className="text-xs text-slate-500">No live suggestions yet. Start typing a brand or model.</p>
          )}
        </div>
      )}

      {typing && (
        <div className="divide-y divide-slate-100">
          {(data.locations || []).length > 0 && (
            <section className="py-2">
              <h4 className="px-4 pt-2 pb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">Locations</h4>
              {data.locations.map((loc) => {
                const idx = items.findIndex((item) => item.type === 'location' && item.label === loc.label);
                return (
                  <button
                    key={loc.label}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold ${
                      activeIndex === idx ? 'bg-blue-50 text-[#3083ff]' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => activate(items[idx])}
                  >
                    📍 {loc.label}{loc.count ? ` (${loc.count} cars)` : ''}
                  </button>
                );
              })}
            </section>
          )}

          {data.models.length > 0 && (
            <section className="py-2">
              <h4 className="px-4 pt-2 pb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">Brands & models</h4>
              {data.models.map((m) => {
                const idx = items.findIndex((item) => item.type === 'model' && item.meta === m);
                return (
                  <button
                    key={`${m.brand}-${m.model}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                      activeIndex === idx ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => activate(items[idx])}
                  >
                    <BrandMark name={m.brand} logo={m.logo} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-slate-900 truncate">{m.brand} {m.model}</span>
                      <span className="text-[11px] font-semibold text-slate-500">{m.count} cars available</span>
                    </span>
                  </button>
                );
              })}
            </section>
          )}

          {data.cars.length > 0 && (
            <section className="py-2">
              <h4 className="px-4 pt-2 pb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">Live inventory</h4>
              {data.cars.map((c) => {
                const idx = items.findIndex((item) => item.type === 'car' && item.meta === c);
                const thumb = c.thumbnail ? mediaUrl(c.thumbnail) : '';
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                      activeIndex === idx ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => activate(items[idx])}
                  >
                    <span className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : null}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-slate-900 truncate">
                        {c.year} {c.brand} {c.model}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">{c.variant || c.title}</span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {c.kmDriven != null ? `${Number(c.kmDriven).toLocaleString('en-IN')} km` : ''}
                        {c.fuel ? ` · ${c.fuel}` : ''}
                        {c.city ? ` · ${c.city}` : ''}
                      </span>
                    </span>
                    <span className="text-sm font-black text-slate-900 shrink-0">{formatINR(c.price)}</span>
                  </button>
                );
              })}
            </section>
          )}

          {data.intents.length > 0 && (
            <section className="py-2">
              <h4 className="px-4 pt-2 pb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">Quick filters</h4>
              {data.intents.map((intent) => {
                const idx = items.findIndex((item) => item.type === 'intent' && item.meta === intent);
                return (
                  <button
                    key={intent.label}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold ${
                      activeIndex === idx ? 'bg-blue-50 text-[#3083ff]' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => activate(items[idx])}
                  >
                    [ {intent.label} Filter ]
                  </button>
                );
              })}
            </section>
          )}

          {!loading && !data.models.length && !data.cars.length && !data.intents.length && (
            <p className="px-4 py-4 text-xs text-slate-500">No live matches for “{query.trim()}”.</p>
          )}

          <button
            type="button"
            role="option"
            aria-selected={activeIndex === items.length - 1}
            className={`w-full px-4 py-3 text-sm font-black ${
              activeIndex === items.length - 1 ? 'bg-[#1853ff] text-white' : 'bg-[#3083ff] text-white hover:bg-[#1853ff]'
            }`}
            onMouseEnter={() => setActiveIndex(items.length - 1)}
            onClick={() => activate(items[items.length - 1])}
          >
            View all results ({data.total} cars found)
          </button>
        </div>
      )}
    </div>
  ) : null;

  const field = (
    <div className={`relative flex-1 flex items-center ${isModal ? 'bg-slate-50 border border-slate-200 rounded-xl px-3' : 'px-3'}`}>
      <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={panelOpen}
        aria-controls="header-search-dropdown"
        placeholder="Search by brand, model, or keyword…"
        className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none py-2"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={onKeyDown}
      />
      {query && (
        <button
          type="button"
          className="text-slate-400 hover:text-slate-700 p-1"
          aria-label="Clear search"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
        >
          <Close className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  if (isModal) {
    if (!open) return null;
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-white flex flex-col md:hidden">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">
          {field}
          <button type="button" className="text-xs font-black text-slate-600 px-2 py-2" onClick={() => onClose?.()}>
            Close
          </button>
        </div>
        {dropdown}
      </div>,
      document.body
    );
  }

  return (
    <>
      {field}
      {dropdown}
    </>
  );
}

export function MobileSearchButton({ onClick }) {
  return (
    <button type="button" className="md:hidden p-2 text-slate-800" aria-label="Search cars" onClick={onClick}>
      <Search className="w-5 h-5" />
    </button>
  );
}
