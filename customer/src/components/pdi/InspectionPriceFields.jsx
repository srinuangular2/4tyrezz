import { ENGINE_PRICE, HISTORY_FEE, OBD_FEE, inr, quoteInspection } from '../../lib/pdiPricing';

const CAR_TYPES = [
  ['UPTO_1249', 'Upto 1249cc', ENGINE_PRICE.UPTO_1249],
  ['ABOVE_1249', 'Above 1249cc', ENGINE_PRICE.ABOVE_1249],
];

export default function InspectionPriceFields({ pdiType, engineBand, obdScan, serviceHistory, onChange, name = 'engineBand', cards = false }) {
  const quote = quoteInspection({ pdiType, engineBand, obdScan, serviceHistory });
  const used = pdiType === 'USED_CAR';

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-[13px] font-semibold text-slate-900">Car type <span className="text-rose-500">*</span></legend>
        <div className={cards ? 'mt-2 grid grid-cols-2 gap-2' : 'mt-2 space-y-2.5'}>
          {CAR_TYPES.map(([id, label, price]) => (
            <label
              key={id}
              className={cards
                ? `flex cursor-pointer flex-col rounded-2xl border px-3 py-3 ${engineBand === id ? 'border-[#3083ff] bg-[#eaf2ff]' : 'border-slate-200 bg-white'}`
                : 'flex cursor-pointer items-center justify-between gap-3 text-[14px] text-slate-800'}
            >
              <span className={cards ? 'flex items-center gap-2 text-[13px] font-semibold text-slate-800' : 'flex items-center gap-2.5'}>
                <input
                  type="radio"
                  name={name}
                  required
                  checked={engineBand === id}
                  onChange={() => onChange('engineBand', id)}
                  className={`h-4 w-4 ${cards ? 'accent-[#3083ff]' : 'accent-[#3083ff]'}`}
                />
                {label}
              </span>
              <span className={cards ? 'mt-1 pl-6 text-[13px] font-semibold text-slate-900' : 'font-medium text-slate-900'}>{inr(price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="text-[13px] font-semibold text-slate-900">Recommended add-ons</p>
        <label className={`mt-2 flex cursor-pointer items-start justify-between gap-3 ${cards ? `rounded-2xl border px-3 py-3 ${obdScan ? 'border-[#3083ff] bg-[#eaf2ff]' : 'border-slate-200 bg-white'}` : ''}`}>
          <span className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={obdScan}
              onChange={(event) => onChange('obdScan', event.target.checked)}
              className={`mt-0.5 h-4 w-4 ${cards ? 'accent-[#3083ff]' : 'accent-[#3083ff]'}`}
            />
            <span>
              <span className="text-[14px] font-medium text-slate-800">
                OBD scanning
                <span className={`ml-1.5 text-[11px] font-semibold ${cards ? 'text-[#3083ff]' : 'text-[#1853ff]'}`}>Recommended</span>
              </span>
              {cards ? (
                <span className="mt-0.5 block text-[12px] font-normal leading-snug text-slate-500">
                  Finds stored engine and sensor faults a visual check cannot see.
                </span>
              ) : null}
            </span>
          </span>
          <span className="text-[14px] font-medium text-slate-900">{inr(OBD_FEE)}</span>
        </label>
        {cards ? null : (
          <p className="mt-1 pl-6 text-[12px] font-normal leading-snug text-slate-500">
            Adds a scan for stored engine, sensor and electronic faults that a visual check cannot see.
          </p>
        )}
      </div>

      {used && (
        <div>
          <p className="text-[13px] font-semibold text-slate-900">Service history and analysis</p>
          <label className={`mt-2 flex cursor-pointer items-start justify-between gap-3 ${cards ? `rounded-2xl border px-3 py-3 ${serviceHistory ? 'border-[#3083ff] bg-[#eaf2ff]' : 'border-slate-200 bg-white'}` : ''}`}>
            <span className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={serviceHistory}
                onChange={(event) => onChange('serviceHistory', event.target.checked)}
                className={`mt-0.5 h-4 w-4 ${cards ? 'accent-[#3083ff]' : 'accent-[#3083ff]'}`}
              />
              <span>
                <span className="text-[14px] font-medium text-slate-800">Service history</span>
                {cards ? (
                  <span className="mt-0.5 block text-[12px] font-normal leading-snug text-slate-500">
                    Past service records, so recurring faults show up before the visit.
                  </span>
                ) : null}
              </span>
            </span>
            <span className="text-[14px] font-medium text-slate-900">{inr(HISTORY_FEE)}</span>
          </label>
          {cards ? null : (
            <p className="mt-1 pl-6 text-[12px] font-normal leading-snug text-slate-500">
              Adds past service records so the engineer can see recurring faults and maintenance gaps before the visit.
            </p>
          )}
        </div>
      )}

      <div className={`flex items-center justify-between ${cards ? 'rounded-2xl bg-slate-900 px-4 py-3 text-white' : 'border-t border-slate-200 pt-3'}`}>
        <span className={`text-[15px] font-semibold ${cards ? 'text-white' : 'text-slate-900'}`}>Total</span>
        <span className={`text-[18px] font-semibold ${cards ? 'text-white' : 'text-slate-900'}`}>{inr(quote.total)}</span>
      </div>
    </div>
  );
}
