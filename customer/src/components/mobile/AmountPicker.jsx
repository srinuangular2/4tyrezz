import { formatINR } from '../PageShell';

export default function AmountPicker({
  label,
  value,
  min,
  max,
  step,
  onChange,
  minLabel,
  maxLabel,
  chipLabel,
  chips = [],
  chipValue,
  onChip,
  chipText,
  chipSuffix,
  prominent = false,
}) {
  const clamp = (next) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <section className="bg-white px-4 pb-4 pt-3">
      <p className="text-center text-[13px] font-medium text-slate-500">{label}</p>
      <div className="mt-1.5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => clamp(value - step)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[18px] font-medium leading-none text-slate-700"
          aria-label="Decrease"
        >
          −
        </button>
        <p className={`min-w-[9rem] text-center tracking-tight text-slate-900 ${prominent ? 'text-[28px] font-bold' : 'text-[22px] font-semibold'}`}>{formatINR(value)}</p>
        <button
          type="button"
          onClick={() => clamp(value + step)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[18px] font-medium leading-none text-slate-700"
          aria-label="Increase"
        >
          +
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => clamp(Number(event.target.value))}
        className="mt-4 h-1.5 w-full cursor-pointer accent-[#3083ff]"
      />
      <div className="mt-1 flex justify-between text-[12px] font-medium text-slate-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {chips.length > 0 && (
        <>
          <p className="mt-5 text-center text-[13px] font-medium text-slate-500">{chipLabel}</p>
          <div className="no-scrollbar -mx-1 mt-2.5 flex gap-2 overflow-x-auto px-1 pb-1">
            {chips.map((chip) => {
              const active = chip === chipValue;
              const text = chipText ? chipText(chip) : chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onChip(chip)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-center ${
                    active ? 'bg-[#e7f8ee] text-[#178a45]' : 'bg-[#f4f6f8] text-slate-800'
                  }`}
                >
                  {chipSuffix ? (
                    <>
                      <span className="block text-[16px] font-semibold leading-none">{text}</span>
                      <span className={`mt-1 block text-[11px] font-normal leading-none ${active ? 'text-[#178a45]' : 'text-slate-500'}`}>{chipSuffix}</span>
                    </>
                  ) : (
                    <span className="block text-[13px] font-medium leading-none">{text}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export function PartnerCard({ recommended, name, onApply, leftLabel, leftValue, rightLabel, rightValue }) {
  const initial = String(name).replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase();
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
      {recommended ? (
        <span className="inline-block rounded-br-xl bg-[#3083ff] px-3 py-1 text-[11px] font-semibold text-white">Recommended</span>
      ) : null}
      <div className={`flex items-center justify-between gap-3 px-3.5 ${recommended ? 'pt-2' : 'pt-3.5'}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[12px] font-semibold text-[#3083ff]">
            {initial}
          </span>
          <p className="truncate text-[13px] font-semibold text-slate-900">{name}</p>
        </div>
        <button
          type="button"
          onClick={onApply}
          className="shrink-0 rounded-lg bg-[#eaf2ff] px-2.5 py-1.5 text-[12px] font-semibold text-[#1853ff]"
        >
          Apply Now
        </button>
      </div>
      <div className="mx-3.5 my-2.5 h-px bg-slate-100" />
      <div className="grid grid-cols-2 gap-3 px-3.5 pb-3">
        <div>
          <p className="text-[11px] font-normal text-slate-500">{leftLabel}</p>
          <p className="mt-0.5 text-[14px] font-semibold text-slate-900">{leftValue}</p>
        </div>
        <div>
          <p className="text-[11px] font-normal text-slate-500">{rightLabel}</p>
          <p className="mt-0.5 text-[14px] font-semibold text-slate-900">{rightValue}</p>
        </div>
      </div>
    </article>
  );
}
