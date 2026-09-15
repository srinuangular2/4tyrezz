import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import api from '../api/axios';
import { PrimaryButton, Skeleton, formatINR } from './PageShell';

export default function CompareCarPicker({ selectedIds, max, onAdd, onRemove, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get('/cars', { params: { search: query || undefined, limit: 24 } })
        .then((r) => setResults(r.data.cars || r.data.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Add car</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedIds.length} of {max}</p>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center" aria-label="Close">
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand, model or title…"
            className="w-full mt-4 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-extrabold focus:outline-none focus:border-[#3083ff] focus:ring-1 focus:ring-[#3083ff]"
          />
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          {!loading && results.length === 0 && (
            <p className="text-sm font-semibold text-slate-500 text-center py-10">No cars matched that search.</p>
          )}
          {!loading &&
            results.map((c) => {
              const id = String(c._id || c.id);
              const picked = selectedIds.includes(id);
              const full = selectedIds.length >= max && !picked;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={full}
                  onClick={() => (picked ? onRemove(id) : onAdd(id))}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    picked ? 'border-[#3083ff] bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'
                  } ${full ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <img src={c.images?.[0] || '/pwa-192.png'} alt="" className="w-20 h-14 object-cover rounded-xl bg-slate-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-sm truncate">{c.title}</p>
                    <p className="text-xs font-bold text-slate-500">{[c.year, c.fuel, c.transmission].filter(Boolean).join(' · ')}</p>
                    <p className="font-black text-sm text-[#3083ff]">{formatINR(c.price)}</p>
                  </div>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${picked ? 'bg-[#3083ff]' : 'border-2 border-slate-300'}`}>
                    {picked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
        </div>
        <div className="p-4 border-t border-slate-100">
          <PrimaryButton className="w-full" onClick={onClose}>
            Done
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
