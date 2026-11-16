import { useMemo } from 'react';
import { useVehicleColors } from '../../hooks/useVehicleCatalog';
import {
  ACCIDENT_TYPES,
  BODY_OPTIONS,
  FEATURE_OPTIONS,
  FUEL_OPTIONS,
  HEALTH_OPTIONS,
  INSURANCE_TYPES,
  MONTHS,
  SERVICE_HISTORY_OPTIONS,
  TRANSMISSION_OPTIONS,
} from './sellCarState';
import { StepHeading, sellChipIdle, sellFieldClass } from './ui';

const sectionTitle = 'mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500';
const fieldLabel = 'text-[13px] font-semibold text-slate-700 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500';

function Choice({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-xs font-extrabold ${active ? 'bg-[#3083ff] text-white border-[#3083ff]' : sellChipIdle}`}
    >
      {children}
    </button>
  );
}

export default function StepSpecs({ state, patch, onBack, onNext }) {
  const { exterior, interior } = useVehicleColors(state.brand, state.model);
  const exteriorOptions = useMemo(() => {
    const list = [...(exterior || [])];
    const current = String(state.color || '').trim();
    if (current && !list.some((item) => item.name.toLowerCase() === current.toLowerCase())) {
      list.unshift({ name: current, hex: '#94A3B8' });
    }
    return list;
  }, [exterior, state.color]);
  const interiorOptions = useMemo(() => {
    const list = [...(interior || [])];
    const current = String(state.interiorColor || '').trim();
    if (current && !list.some((item) => item.name.toLowerCase() === current.toLowerCase())) {
      list.unshift({ name: current, hex: '#94A3B8' });
    }
    return list;
  }, [interior, state.interiorColor]);

  return (
    <div className="space-y-5 lg:space-y-7">
      <StepHeading
        step={3}
        title="Car specifications"
        desktopTitle="Specifications and history"
        hint="Fuel, colour, insurance and condition. Price comes after this."
        desktopHint="The same vehicle facts used when a car is added by admin."
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={fieldLabel}>Registration month</span>
          <select
            value={state.month || 1}
            onChange={(e) => patch({ month: Number(e.target.value) })}
            className={`mt-1.5 ${sellFieldClass}`}
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={fieldLabel}>RTO</span>
          <input
            value={state.rto}
            onChange={(e) => patch({ rto: e.target.value })}
            placeholder="Hyderabad / TS09"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
      </section>

      <section>
        <h3 className={sectionTitle}>Fuel</h3>
        <div className="flex flex-wrap gap-2">
          {FUEL_OPTIONS.map((fuel) => (
            <Choice key={fuel} active={state.fuel === fuel} onClick={() => patch({ fuel })}>{fuel}</Choice>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Transmission</h3>
        <div className="flex flex-wrap gap-2">
          {TRANSMISSION_OPTIONS.map((item) => (
            <Choice key={item} active={state.transmission === item} onClick={() => patch({ transmission: item })}>{item}</Choice>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Body type</h3>
        <div className="flex flex-wrap gap-2">
          {BODY_OPTIONS.map((item) => (
            <Choice key={item} active={state.bodyType === item} onClick={() => patch({ bodyType: item })}>{item}</Choice>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Colour</h3>
        {exteriorOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {exteriorOptions.map((item) => (
              <Choice key={item.name} active={String(state.color).toLowerCase() === item.name.toLowerCase()} onClick={() => patch({ color: item.name })}>
                <span className="mr-1.5 inline-block h-3 w-3 rounded-full border border-black/10 align-middle" style={{ background: item.hex }} />
                {item.name}
              </Choice>
            ))}
          </div>
        ) : (
          <input
            value={state.color}
            onChange={(e) => patch({ color: e.target.value })}
            placeholder="White"
            className={sellFieldClass}
          />
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={fieldLabel}>Interior colour</span>
          {interiorOptions.length > 0 ? (
            <select
              value={state.interiorColor}
              onChange={(e) => patch({ interiorColor: e.target.value })}
              className={`mt-1.5 ${sellFieldClass}`}
            >
              <option value="">Select interior</option>
              {interiorOptions.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          ) : (
            <input
              value={state.interiorColor}
              onChange={(e) => patch({ interiorColor: e.target.value })}
              placeholder="Beige"
              className={`mt-1.5 ${sellFieldClass}`}
            />
          )}
        </label>
        <label className="block">
          <span className={fieldLabel}>Where is the car parked?</span>
          <input
            value={state.parkedAddress}
            onChange={(e) => patch({ parkedAddress: e.target.value })}
            placeholder="Area, street or society"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Area</span>
          <input
            value={state.locationArea}
            onChange={(e) => patch({ locationArea: e.target.value })}
            placeholder="Gachibowli"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Pincode</span>
          <input
            value={state.pincode}
            onChange={(e) => patch({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            inputMode="numeric"
            placeholder="500032"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
      </section>

      <section>
        <h3 className={sectionTitle}>Vehicle health</h3>
        <div className="flex flex-wrap gap-2">
          {HEALTH_OPTIONS.map((item) => (
            <Choice key={item.label} active={state.engineState === item.label} onClick={() => patch({ engineState: item.label })}>
              {item.label}
            </Choice>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Key features</h3>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((name) => {
            const on = (state.features || []).includes(name);
            return (
              <Choice
                key={name}
                active={on}
                onClick={() => patch({
                  features: on
                    ? state.features.filter((item) => item !== name)
                    : [...(state.features || []), name],
                })}
              >
                {on ? '✓ ' : ''}{name}
              </Choice>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Number of keys</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2].map((count) => (
            <Choice key={count} active={Number(state.keyCount) === count} onClick={() => patch({ keyCount: count })}>
              {count} {count === 1 ? 'key' : 'keys'}
            </Choice>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className={sectionTitle}>Accidents</h3>
          <div className="flex flex-wrap gap-2">
            <Choice active={state.accidental === 'No'} onClick={() => patch({ accidental: 'No', accidentDetails: '' })}>No accidents</Choice>
            <Choice active={state.accidental === 'Yes'} onClick={() => patch({ accidental: 'Yes' })}>Accidental</Choice>
          </div>
          {state.accidental === 'Yes' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {ACCIDENT_TYPES.map((type) => (
                <Choice key={type} active={state.accidentDetails === type} onClick={() => patch({ accidentDetails: type })}>
                  {type}
                </Choice>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className={sectionTitle}>Flood damage</h3>
          <div className="flex flex-wrap gap-2">
            <Choice active={state.floodDamage !== 'Yes'} onClick={() => patch({ floodDamage: 'No' })}>Clean</Choice>
            <Choice active={state.floodDamage === 'Yes'} onClick={() => patch({ floodDamage: 'Yes' })}>Flooded</Choice>
          </div>
        </div>
        <div>
          <h3 className={sectionTitle}>Loan on this car</h3>
          <div className="flex flex-wrap gap-2">
            <Choice active={state.loanOnCar !== 'Yes'} onClick={() => patch({ loanOnCar: 'No' })}>No loan</Choice>
            <Choice active={state.loanOnCar === 'Yes'} onClick={() => patch({ loanOnCar: 'Yes' })}>Loan running</Choice>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={fieldLabel}>Insurance type</span>
          <select
            value={state.insuranceType || 'Comprehensive'}
            onChange={(e) => patch({ insuranceType: e.target.value })}
            className={`mt-1.5 ${sellFieldClass}`}
          >
            {INSURANCE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={fieldLabel}>Insurance expiry</span>
          <input
            type="date"
            value={state.insuranceExpiry || ''}
            onChange={(e) => patch({ insuranceExpiry: e.target.value, insuranceUpto: e.target.value })}
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>PUC expiry</span>
          <input
            type="date"
            value={state.pucExpiry || ''}
            onChange={(e) => patch({ pucExpiry: e.target.value })}
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Service history log</span>
          <input
            value={state.serviceHistoryLog}
            onChange={(e) => patch({ serviceHistoryLog: e.target.value })}
            placeholder="Last service date / notes"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
      </section>

      <section>
        <h3 className={sectionTitle}>Service history</h3>
        <div className="flex flex-wrap gap-2">
          {SERVICE_HISTORY_OPTIONS.map((item) => (
            <Choice key={item} active={state.serviceHistory === item} onClick={() => patch({ serviceHistory: item })}>{item}</Choice>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className={sectionTitle}>Tyre condition</h3>
          <p className="font-black text-slate-900">{state.tyreCondition}%</p>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          value={state.tyreCondition}
          onChange={(e) => patch({ tyreCondition: Number(e.target.value) })}
          className="w-full cursor-pointer accent-[#3083ff]"
        />
      </section>

      <div className="hidden gap-3 pt-2 lg:flex">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-wider text-slate-700">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-xl bg-[#3083ff] py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#1853ff]"
        >
          See estimate
        </button>
      </div>
    </div>
  );
}
