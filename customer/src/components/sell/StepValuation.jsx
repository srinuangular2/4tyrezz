import { formatINR } from '../PageShell';
import { HUBS, conditionScoreFromPills } from './sellCarState';
import { StepHeading, sellFieldClass } from './ui';

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
    <div className="space-y-5 lg:space-y-7">
      <StepHeading
        step={3}
        title="Your price and a visit slot"
        desktopTitle="Estimated market value"
        hint="This range is a guide. Pick the price you want and when we should inspect the car."
        desktopHint="Indicative range from brand, model, mileage and condition. This is not a purchase offer."
      />

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
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Indicative estimate</p>
            <p className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-white lg:text-4xl lg:font-bold">
              {formatINR(v.minPrice)} – {formatINR(v.maxPrice)}
            </p>
            <p className="mt-2 text-[13px] font-normal text-blue-100">Fair value {formatINR(v.estimate)}</p>
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
        <span className="text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">What price do you want?</span>
          <span className="hidden lg:inline">Your expected price (₹)</span>
        </span>
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
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">Where should we inspect?</span>
          <span className="hidden lg:inline">Inspection</span>
        </h3>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {[
            { id: 'home', title: 'Home inspection', body: 'Executive visits your address' },
            //{ id: 'hub', title: 'Nearest 4TYREZZ hub', body: 'Drive in, faster slot' },
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
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">Which day?</span>
          <span className="hidden lg:inline">Select date</span>
        </h3>
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
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">What time?</span>
          <span className="hidden lg:inline">Time slot</span>
        </h3>
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
    <div className="rounded-xl border border-white/15 bg-white/10 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 text-[12px] font-medium capitalize leading-tight text-white">{value}</p>
    </div>
  );
}
