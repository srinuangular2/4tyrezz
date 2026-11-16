import { HUBS } from './sellCarState';
import { StepHeading, sellFieldClass } from './ui';

function nextDays(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
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

export default function StepVisit({ state, patch, onBack, onNext }) {
  const days = nextDays(7);
  const cityHubs = HUBS.filter((h) => !state.city || h.city === state.city);
  const hubs = cityHubs.length ? cityHubs : HUBS;
  const ready = Boolean(state.inspectionDate && state.inspectionSlot);

  return (
    <div className="space-y-5 lg:space-y-7">
      <StepHeading
        step={6}
        title="Book the inspection"
        desktopTitle="Inspection slot"
        hint="Photos are in. Pick when we should come and see the car."
        desktopHint="The visit is booked only after the photos are uploaded."
      />

      <section>
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">
          <span className="lg:hidden">Where should we inspect?</span>
          <span className="hidden lg:inline">Inspection</span>
        </h3>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => patch({ inspectionType: 'home' })}
            className={`rounded-2xl border px-4 py-4 text-left ${
              state.inspectionType === 'home' ? 'border-[#3083ff] bg-[#EAF2FF]' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-sm font-extrabold text-slate-900">Home inspection</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">Executive visits your address</p>
          </button>
        </div>
        {state.inspectionType === 'hub' && (
          <select
            value={state.hubId}
            onChange={(e) => patch({ hubId: e.target.value })}
            className={`mt-3 ${sellFieldClass}`}
          >
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>{h.name} · {h.city}</option>
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
                state.inspectionDate === d.iso ? 'border-[#3083ff] bg-[#3083ff] text-white' : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{d.label}</p>
              <p className="mt-1 text-lg font-black leading-none">{d.date}</p>
              <p className="mt-1 text-[10px] font-bold">{d.month}</p>
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
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">{group}</p>
            <div className="grid grid-cols-2 gap-2">
              {times.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => patch({ inspectionSlot: slot })}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-extrabold ${
                    state.inspectionSlot === slot ? 'border-[#3083ff] bg-[#3083ff] text-white' : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="hidden gap-3 lg:flex">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-wider text-slate-700">
          Back
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={onNext}
          className="flex-1 rounded-xl bg-[#3083ff] py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#1853ff] disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
