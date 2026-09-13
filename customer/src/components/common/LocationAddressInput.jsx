import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

export default function LocationAddressInput({
  value = '',
  placeholder = 'Search area, street or landmark',
  onChange,
  onSelect,
  city = '',
  className = '',
}) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/locations/geocode', { params: { q, city } });
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, city]);

  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (row) => {
    const label = [row.area, row.city, row.state].filter(Boolean).join(', ') || row.formattedAddress || query;
    setQuery(label);
    setOpen(false);
    onChange?.(label);
    onSelect?.({
      state: row.state || '',
      city: row.city || '',
      area: row.area || '',
      pincode: row.pincode || '',
      formattedAddress: row.formattedAddress || label,
      lat: row.lat,
      lng: row.lng,
      pickupLocation: row.formattedAddress || label,
    });
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        value={query}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange?.(e.target.value);
        }}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-40 max-h-56 overflow-y-auto">
          {loading && <p className="px-3 py-2 text-xs text-slate-400">Looking up live addresses…</p>}
          {results.map((row) => (
            <button
              key={`${row.lat}-${row.lng}-${row.label}`}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50"
              onClick={() => pick(row)}
            >
              <span className="block font-bold text-slate-800">📍 {[row.area, row.city].filter(Boolean).join(', ') || row.city}</span>
              <span className="block text-slate-500 truncate">{row.formattedAddress}</span>
            </button>
          ))}
          {!loading && !results.length && query.trim().length >= 3 && (
            <p className="px-3 py-2 text-xs text-slate-500">No live address matches.</p>
          )}
        </div>
      )}
    </div>
  );
}
