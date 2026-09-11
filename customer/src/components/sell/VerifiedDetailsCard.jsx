import { monthLabel } from './sellCarState';

export default function VerifiedDetailsCard({ state, onEdit, onContinue }) {
  const specs = [
    ['Make', state.brand],
    ['Model', state.model],
    ['Variant', state.variant || '—'],
    ['Registered', `${monthLabel(state.month)} ${state.year}`],
    ['Fuel / gearbox', `${state.fuel} · ${state.transmission}`],
    ['Colour', state.color || '—'],
    ['RTO', state.rto || `${state.city}${state.state ? `, ${state.state}` : ''}` || '—'],
    ['Insurance up to', state.insuranceUpto || '—'],
  ].filter(([, v]) => v && v !== '—');

  return (
    <div className="rounded-3xl border border-[#3083ff]/25 bg-gradient-to-br from-[#EAF2FF] to-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Verified details</p>
          <h3 className="font-display font-black text-slate-900 text-xl mt-1">
            {state.year} {state.brand} {state.model}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">{state.plate}</p>
        </div>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          Auto-filled
        </span>
      </div>

      <dl className="mt-5 grid sm:grid-cols-2 gap-3">
        {specs.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white/80 border border-slate-200 px-3.5 py-3">
            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{k}</dt>
            <dd className="text-sm font-extrabold text-slate-900 mt-0.5">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 bg-[#3083ff] hover:bg-[#1853ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3.5"
        >
          Looks right — continue
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 border border-slate-200 bg-white text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3.5 hover:border-[#3083ff]/40"
        >
          Edit / change manually
        </button>
      </div>
    </div>
  );
}
