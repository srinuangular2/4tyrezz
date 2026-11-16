import { formatINR } from '../PageShell';
import { conditionScoreFromPills } from './sellCarState';
import { StepHeading, sellFieldClass } from './ui';

export default function StepValuation({ state, patch, valuating, onBack, onNext }) {
  const score = conditionScoreFromPills(state.conditions);
  const v = state.valuation;
  const pending = !v && !valuating;
  const expected = Number(state.expectedPrice);

  return (
    <div className="space-y-5 lg:space-y-7">
      <StepHeading
        step={4}
        title="Your expected price"
        desktopTitle="Estimated market value"
        hint="This range is a guide. Pick the price you want. Photos come next, then the inspection slot."
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

      <div className="hidden lg:flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-wider text-slate-700">
          Back
        </button>
        <button
          type="button"
          disabled={!(Number(state.expectedPrice) > 0)}
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
