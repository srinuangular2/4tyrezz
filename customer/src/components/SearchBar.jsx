import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useReferenceData from '../hooks/useReferenceData';
import api from '../api/axios';
import { Search, Close } from './icons';

const RECENT_KEY = '4tyrezz_recent_searches';
const MAX_RECENT = 5;

const loadRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
};

const saveRecent = (query) => {
  if (!query) return loadRecent();
  const existing = loadRecent().filter((q) => q.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  return updated;
};

export default function SearchBar({ className = '' }) {
  const navigate = useNavigate();
  const { brands, cities } = useReferenceData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const boxRef = useRef(null);

  const [quickFilters, setQuickFilters] = useState([]);

  useEffect(() => {
    setRecent(loadRecent());
    api
      .get('/meta/car-filters')
      .then((r) => {
        const f = r.data || {};
        const items = [];
        if (f.bodyTypes?.includes('SUV')) items.push({ label: 'Used SUVs', params: { bodyType: 'SUV' } });
        if (f.transmissions?.includes('Automatic')) {
          items.push({ label: 'Used Automatic cars', params: { transmission: 'Automatic' } });
        }
        if (f.fuels?.includes('Electric')) {
          items.push({ label: 'Electric cars', params: { fuel: 'Electric' } });
        }
        setQuickFilters(items);
      })
      .catch(() => setQuickFilters([]));
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goSearch = (q) => {
    setOpen(false);
    if (!q) return;

    const clean = q.trim().toLowerCase();
    
    // 1. Check if the typed search query matches a city name
    const matchedCity = cities.find((c) => c.name.toLowerCase() === clean);
    if (matchedCity) {
      setRecent(saveRecent(q));
      navigate(`/cars?city=${matchedCity._id}`);
      return;
    }

    // 2. Check if the typed search query matches a brand name
    const matchedBrand = brands.find((b) => b.name.toLowerCase() === clean);
    if (matchedBrand) {
      setRecent(saveRecent(q));
      navigate(`/cars?brand=${matchedBrand._id}`);
      return;
    }

    // 3. Fallback to generic text search for model, title, etc.
    setRecent(saveRecent(q));
    navigate(`/cars?search=${encodeURIComponent(q)}`);
  };

  const goParams = (params, label) => {
    setOpen(false);
    if (label) setRecent(saveRecent(label));
    const search = new URLSearchParams(params);
    navigate(`/cars?${search.toString()}`);
  };

  const removeRecent = (q, e) => {
    e.stopPropagation();
    const updated = loadRecent().filter((r) => r !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecent(updated);
  };

  // Filter lists based on what the user types
  const cleanQuery = query.trim().toLowerCase();

  const matchingCities = cities.filter((c) => c.name.toLowerCase().includes(cleanQuery));
  const matchingBrands = brands.filter((b) => b.name.toLowerCase().includes(cleanQuery));

  const staticCategories = quickFilters
    .map((item) => ({
      label: item.label,
      action: () => goParams(item.params, item.label),
    }))
    .filter((item) => item.label.toLowerCase().includes(cleanQuery));

  const popular = [
    ...cities.slice(0, 4).map((c) => ({
      label: `Used cars in ${c.name}`,
      action: () => goParams({ city: c._id }, `Used cars in ${c.name}`),
    })),
    ...brands.slice(0, 3).map((b) => ({
      label: `Used ${b.name} cars`,
      action: () => goParams({ brand: b._id }, `${b.name} cars`),
    })),
    ...staticCategories,
  ];

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goSearch(query.trim());
        }}
        className="relative"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search cars, brands or models"
          className="w-full  border border-slate-400 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-ember focus:bg-white transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(true);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <Close className="w-4 h-4" />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-fadeUp max-h-[380px] overflow-y-auto">
          {cleanQuery ? (
            /* ---- LIVE SEARCH MATCHES MODE ---- */
            <>
              {/* Direct query submission shortcut */}
              <button
                type="button"
                onClick={() => goSearch(query.trim())}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm font-medium text-ember hover:bg-slate-50 border-b border-slate-100"
              >
                <Search className="w-4 h-4 text-ember flex-shrink-0" />
                Search for "{query.trim()}"
              </button>

              {/* City matches */}
              {matchingCities.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 mt-1">
                    Cities
                  </p>
                  {matchingCities.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => goParams({ city: c._id }, `Used cars in ${c.name}`)}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      Used cars in <span className="font-semibold text-slate-800">{c.name}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Brand matches */}
              {matchingBrands.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 mt-1">
                    Brands
                  </p>
                  {matchingBrands.map((b) => (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => goParams({ brand: b._id }, `${b.name} cars`)}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      Used <span className="font-semibold text-slate-800">{b.name}</span> cars
                    </button>
                  ))}
                </>
              )}

              {/* Category / Static matches */}
              {staticCategories.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 mt-1">
                    Categories
                  </p>
                  {staticCategories.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </>
              )}

              {matchingCities.length === 0 &&
                matchingBrands.length === 0 &&
                staticCategories.length === 0 && (
                  <p className="px-4 py-3 text-xs text-slate-400">
                    Press Enter to search for "{query.trim()}"
                  </p>
                )}
            </>
          ) : (
            /* ---- INITIAL RECENT & POPULAR MODE ---- */
            <>
              {recent.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Recent searches
                  </p>
                  {recent.map((q) => (
                    <div
                      key={q}
                      className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 transition group"
                    >
                      <button
                        type="button"
                        onClick={() => goSearch(q)}
                        className="flex items-center gap-2.5 flex-1 text-left"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        {q}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removeRecent(q, e)}
                        aria-label={`Remove "${q}" from recent searches`}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-ember transition"
                      >
                        <Close className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              )}

              <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 mt-1">
                Popular searches
              </p>
              {popular.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={p.action}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition"
                >
                  <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  {p.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}