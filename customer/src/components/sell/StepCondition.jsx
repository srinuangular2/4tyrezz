import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { formatPlateInput } from '../../lib/fetchVehicleDetailsByReg';
import {
  CONDITION_PILLS,
  HUBS,
  KM_PRESETS,
  OWNER_OPTIONS,
  cityFromPlate,
  conditionMessage,
  conditionReady,
  matchCityName,
  plateError,
  variantError,
} from './sellCarState';
import { StepHeading, sellChipIdle, sellFieldClass } from './ui';

export default function StepCondition({ state, patch, cities, onBack, onNext }) {
  const plateMsg = plateError(state.plate);
  const variantMsg = variantError(state.variant);

  useEffect(() => {
    if (state.city || !state.plate) return;
    const guess = cityFromPlate(state.plate);
    const name = matchCityName(guess, cities);
    if (!name) return;
    const hub = HUBS.find((item) => item.city === name);
    patch({ city: name, hubId: hub?.id || state.hubId });
  }, [cities, patch, state.city, state.hubId, state.plate]);
  const toggle = (id) => {
    const next = state.conditions.includes(id)
      ? state.conditions.filter((x) => x !== id)
      : [...state.conditions, id];
    patch({ conditions: next });
  };

  return (
    <div className="space-y-5 lg:space-y-7">
      <StepHeading
        step={2}
        title="Tell us about the car"
        desktopTitle="Condition and location"
        hint="Kilometres, owners and city. Photos come after the price."
        desktopHint="Kilometres, owners, city and registration. Photos are the next step."
      />

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
            <span className="lg:hidden">How many kilometres?</span>
            <span className="hidden lg:inline">Kilometres driven</span>
          </h3>
          <p className="font-black text-slate-900">{Number(state.kmDriven).toLocaleString('en-IN')} km</p>
        </div>
        <input
          type="range"
          min={1000}
          max={200000}
          step={1000}
          value={state.kmDriven}
          onChange={(e) => patch({ kmDriven: Number(e.target.value) })}
          className="w-full accent-[#3083ff] cursor-pointer"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {KM_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => patch({ kmDriven: p.value })}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border ${
                Math.abs(state.kmDriven - p.value) < 8000
                  ? 'bg-[#3083ff] text-white border-[#3083ff]'
                  : sellChipIdle
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">How many owners?</span>
          <span className="hidden lg:inline">Owner count</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {OWNER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => patch({ ownership: o.value })}
              className={`rounded-xl border px-3 py-3 text-xs font-extrabold ${
                Number(state.ownership) === o.value
                  ? 'bg-[#3083ff] text-white border-[#3083ff]'
                  : sellChipIdle
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">What is the condition?</span>
          <span className="hidden lg:inline">Vehicle condition</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {CONDITION_PILLS.map((p) => {
            const on = state.conditions.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`px-3.5 py-2.5 rounded-full text-xs font-extrabold border transition ${
                  on ? 'bg-[#EAF2FF] text-[#1853ff] border-[#3083ff]/40' : `${sellChipIdle} text-slate-600`
                }`}
              >
                {on ? '✓ ' : ''}
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[13px] font-semibold text-slate-700 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">Registration number</span>
          <input
            value={state.plate}
            onChange={(e) => patch({ plate: formatPlateInput(e.target.value) })}
            placeholder="TS 09 AB 1234"
            className={`mt-1.5 ${sellFieldClass} ${state.plate && plateMsg ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
          />
          {state.plate && plateMsg && (
            <p className="text-xs font-semibold text-rose-600 mt-1.5">{plateMsg}</p>
          )}
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-slate-700 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">Variant</span>
          <input
            value={state.variant}
            onChange={(e) => patch({ variant: e.target.value })}
            placeholder="e.g. SX (O)"
            className={`mt-1.5 ${sellFieldClass} ${state.variant && variantMsg ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
          />
          {state.variant && variantMsg && (
            <p className="text-xs font-semibold text-rose-600 mt-1.5">{variantMsg}</p>
          )}
        </label>
      </section>

      <section>
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">Which city is the car in?</span>
          <span className="hidden lg:inline">Location</span>
        </h3>
        <p className="text-xs font-medium text-slate-400 mb-2">
          Auto-selected from the plate prefix{state.rto ? ` · ${state.rto}` : ''}. Change if needed.
        </p>
        <select
          value={state.city}
          onChange={(e) => {
            const city = e.target.value;
            const hub = HUBS.find((h) => h.city === city);
            patch({ city, hubId: hub?.id || state.hubId });
          }}
          className={sellFieldClass}
        >
          <option value="">Select city</option>
          {(cities || []).map((c) => (
            <option key={c._id || c.name} value={c.name}>
              {c.name}
              {c.state ? ` · ${c.state}` : ''}
            </option>
          ))}
        </select>
      </section>

      <div className="flex gap-3 pt-2 hidden lg:flex">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-wider text-slate-700">
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (plateMsg) {
              toast.error(plateMsg);
              return;
            }
            if (variantMsg) {
              toast.error(variantMsg);
              return;
            }
            if (!conditionReady(state)) {
              toast.error(conditionMessage(state));
              return;
            }
            onNext();
          }}
          className="flex-1 rounded-xl bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white py-3.5 text-xs font-black uppercase tracking-wider"
        >
          Get valuation
        </button>
      </div>
    </div>
  );
}
