import { useEffect, useState } from 'react';
import api from '../api/axios';

const POS = {
  great: { label: 'Great price', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  fair: { label: 'Fair market', cls: 'bg-blue-50 text-[#1853ff] border-blue-200' },
  high: { label: 'On the higher side', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  overpriced: { label: 'Above market', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function inr(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function ValuationPanel({ form, onApply }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ready = form.brand && form.model && form.year && form.kmDriven;

  useEffect(() => {
    if (!ready) {
      setData(null);
      return undefined;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data: res } = await api.post('/valuations/estimate', {
          brand: form.brand,
          model: form.model,
          year: Number(form.year),
          kmDriven: Number(form.kmDriven),
          ownership: Number(form.ownership || 1),
          conditionScore: Number(form.conditionScore || 7),
          fuel: form.fuel,
          transmission: form.transmission,
          bodyType: form.bodyType,
          price: form.price ? Number(form.price) : undefined,
        });
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Could not estimate');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    form.brand,
    form.model,
    form.year,
    form.kmDriven,
    form.ownership,
    form.conditionScore,
    form.fuel,
    form.transmission,
    form.bodyType,
    form.price,
    ready,
  ]);

  const pos = data?.position ? POS[data.position] : null;
  const ask = Number(form.price) || 0;
  const span = data ? data.maxPrice - data.minPrice : 1;
  const marker = data && ask ? Math.min(100, Math.max(0, ((ask - data.minPrice) / span) * 100)) : null;

  return (
    <div className="rounded-2xl border border-[#3083ff]/20 bg-gradient-to-br from-[#EAF2FF] to-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Assured valuation</p>
          <h3 className="font-display font-black text-slate-900 text-lg mt-1">Market price engine</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Brand + model + year + kilometres + owners + condition. Live comps first, formula fallback.
          </p>
        </div>
        {pos && <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${pos.cls}`}>{pos.label}</span>}
      </div>

      {!ready && (
        <p className="text-sm font-semibold text-slate-500 mt-5">Add brand, model, year and kilometres to generate a range.</p>
      )}
      {loading && <p className="text-sm font-semibold text-[#3083ff] mt-5">Calculating from live inventory…</p>}
      {error && <p className="text-sm font-semibold text-rose-600 mt-5">{error}</p>}

      {data && !loading && (
        <>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-5">Estimated fair value</p>
          <p className="font-display font-black text-3xl text-slate-900 tracking-tight">{inr(data.estimate)}</p>
          <p className="text-sm font-extrabold text-[#3083ff] mt-1">
            Band {inr(data.minPrice)} – {inr(data.maxPrice)}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Source: {data.source === 'comparables' ? `${data.comps} similar listings` : data.source === 'external' ? 'partner API' : '4tyrezz formula'}
          </p>

          <div className="mt-4 h-2.5 rounded-full bg-white border border-slate-200 overflow-hidden relative">
            <div className="absolute inset-y-0 left-[18%] right-[18%] bg-[#3083ff]/40" />
            {marker != null && (
              <span
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-900 border-2 border-white"
                style={{ left: `calc(${marker}% - 6px)` }}
              />
            )}
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
            <span>Great buy</span>
            <span>Fair</span>
            <span>High</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button
              type="button"
              onClick={() => onApply?.({ price: data.estimate, marketPriceMin: data.minPrice, marketPriceMax: data.maxPrice })}
              className="px-4 py-2.5 rounded-xl bg-[#3083ff] text-white text-xs font-black hover:bg-[#1853ff]"
            >
              Use estimate as asking price
            </button>
            <button
              type="button"
              onClick={() => onApply?.({ marketPriceMin: data.minPrice, marketPriceMax: data.maxPrice })}
              className="px-4 py-2.5 rounded-xl border border-[#3083ff] text-[#3083ff] text-xs font-black hover:bg-blue-50"
            >
              Fill market band only
            </button>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-3 leading-relaxed">{data.disclaimer}</p>
        </>
      )}
    </div>
  );
}
