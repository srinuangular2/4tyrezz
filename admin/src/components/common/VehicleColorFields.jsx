import { useMemo } from 'react';
import { useVehicleColors } from '../../hooks/useVehicleCatalog';

export default function VehicleColorFields({ form, set, input, labelCls }) {
  const { exterior, interior, matched, loading } = useVehicleColors(form.brand, form.model);

  const exteriorOptions = useMemo(() => {
    const list = [...(exterior || [])];
    const current = String(form.color || '').trim();
    if (current && !list.some((c) => c.name.toLowerCase() === current.toLowerCase())) {
      list.unshift({ name: current, hex: '#94A3B8' });
    }
    return list;
  }, [exterior, form.color]);

  const interiorOptions = useMemo(() => {
    const list = [...(interior || [])];
    const current = String(form.interiorColor || '').trim();
    if (current && !list.some((c) => c.name.toLowerCase() === current.toLowerCase())) {
      list.unshift({ name: current, hex: '#94A3B8' });
    }
    return list;
  }, [interior, form.interiorColor]);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <span className={labelCls}>Colour</span>
        <p className="text-[11px] text-slate-500 mb-3">
          {loading
            ? 'Loading model colours…'
            : matched
              ? `Official ${form.model} shades`
              : form.model
                ? 'Common market shades for this model'
                : 'Select brand and model for factory colours'}
        </p>
        <div className="flex flex-wrap gap-2">
          {exteriorOptions.map((c) => {
            const active = String(form.color || '').toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => set('color', c.name)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                  style={{ background: c.hex }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <label className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <span className={labelCls}>Interior colour</span>
        <select
          className={input}
          value={form.interiorColor || ''}
          onChange={(e) => set('interiorColor', e.target.value)}
        >
          <option value="">Select interior</option>
          {interiorOptions.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </label>
    </>
  );
}
