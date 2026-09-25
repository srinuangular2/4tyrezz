import { formatINR } from '../PageShell';
import { HUBS, conditionScoreFromPills } from './sellCarState';
import { sellFieldClass } from './ui';

function nextDays(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
    };
  });
}

const SLOTS = {
  Morning: ['9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM'],
  Afternoon: ['1:00 PM – 3:00 PM', '3:00 PM – 5:00 PM'],
  Evening: ['5:00 PM – 7:00 PM'],
};

export default function StepValuation({ state, patch, valuating, onBack, onNext }) {
  const days = nextDays(7);
  const score = conditionScoreFromPills(state.conditions);
  const v = state.valuation;
  const pending = !v && !valuating;
  const cityHubs = HUBS.filter((h) => !state.city || h.city === state.city);
  const hubs = cityHubs.length ? cityHubs : HUBS;
  const expected = Number(state.expectedPrice);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Step 3</p>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">Estimated market value</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Indicative range from brand, model, mileage and condition. This is not a purchase offer.
        </p>
      </div>

      <div className="rounded-3xl border border-[#3083ff]/20 bg-gradient-to-br from-[#0F172A] to-[#1853ff] text-white p-6">
        {valuating ? (
          <p className="font-bold text-white/80">Calculating from live inventory…</p>
        ) : pending ? (
          <>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">Valuation pending</p>
            <p className="font-display font-black text-2xl mt-2">Estimate unavailable right now</p>
            <p className="text-sm font-semibold text-blue-100 mt-2">
              You can still submit. A dealer will inspect and share a final offer.
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Indicative estimate</p>
            <p className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-2">
              {formatINR(v.minPrice)} – {formatINR(v.maxPrice)}
            </p>
            <p className="text-sm font-bold text-blue-100 mt-2">Fair value {formatINR(v.estimate)}</p>
            <div className="grid grid-cols-3 gap-2 mt-6">
              <Driver label="Demand" value={v.source === 'comparables' ? 'High' : 'Steady'} />
              <Driver label="Condition" value={`${score}/10`} />
              <Driver label="Source" value={v.source === 'comparables' ? `${v.comps || 0} comps` : v.source} />
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-semibold text-amber-800 leading-relaxed">
        This is an estimated market value only — not a final purchase offer. A 4TYREZZ dealer confirms price after physical inspection.
      </div>

      <label className="block">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Your expected price (₹)</span>
        <input
          type="number"
          min={10000}
          value={state.expectedPrice}
          onChange={(e) => patch({ expectedPrice: e.target.value })}
          placeholder="What you hope to receive"
          className={`mt-1.5 ${sellFieldClass}`}
        />
        {v?.estimate && expected > 0 && (
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Estimate {formatINR(v.estimate)} · Your expectation {formatINR(expected)}
          </p>
        )}
      </label>

      <section>
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Inspection</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'home', title: 'Home inspection', body: 'Executive visits your address' },
            { id: 'hub', title: 'Nearest 4TYREZZ hub', body: 'Drive in, faster slot' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => patch({ inspectionType: opt.id, hubId: opt.id === 'hub' ? state.hubId || hubs[0]?.id : state.hubId })}
              className={`text-left rounded-2xl border px-4 py-4 ${
                state.inspectionType === opt.id
                  ? 'border-[#3083ff] bg-[#EAF2FF]'
                  : 'bg-white border-slate-200'
              }`}
            >
              <p className="text-sm font-extrabold text-slate-900">{opt.title}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">{opt.body}</p>
            </button>
          ))}
        </div>
        {state.inspectionType === 'hub' && (
          <select
            value={state.hubId}
            onChange={(e) => patch({ hubId: e.target.value })}
            className={`mt-3 ${sellFieldClass}`}
          >
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} · {h.city}
              </option>
            ))}
          </select>
        )}
      </section>

      <section>
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Select date</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => patch({ inspectionDate: d.iso })}
              className={`min-w-[76px] rounded-2xl border px-3 py-3 ${
                state.inspectionDate === d.iso ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{d.label}</p>
              <p className="text-lg font-black leading-none mt-1">{d.date}</p>
              <p className="text-[10px] font-bold mt-1">{d.month}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Time slot</h3>
        {Object.entries(SLOTS).map(([group, times]) => (
          <div key={group} className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">{group}</p>
            <div className="grid grid-cols-2 gap-2">
              {times.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => patch({ inspectionSlot: t })}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-extrabold ${
                    state.inspectionSlot === t ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="hidden lg:flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-wider text-slate-700">
          Back
        </button>
        <button
          type="button"
          disabled={!state.inspectionDate || !state.inspectionSlot || !(Number(state.expectedPrice) > 0)}
          onClick={onNext}
          className="flex-1 rounded-xl bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white py-3.5 text-xs font-black uppercase tracking-wider"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Driver({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-sm font-extrabold mt-0.5 capitalize">{value}</p>
    </div>
  );
}
