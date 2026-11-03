import { useEffect, useState } from 'react';

export function useIsPhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setPhone(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return phone;
}

export const sellFieldClass =
  'w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-[#3083ff] focus:ring-2 focus:ring-[#3083ff]/20 shadow-sm transition';

export const sellChipIdle =
  'bg-white border-slate-200 text-slate-700 hover:border-[#3083ff]';

export function Stepper({ step }) {
  const labels = ['Car', 'Details', 'Price', 'Photos', 'Book'];
  return (
    <div className="mb-4 lg:mb-8">
      <div className="flex items-center gap-1.5 lg:gap-2">
        {labels.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="min-w-0 flex-1">
              <div className={`h-1.5 rounded-full ${done || active ? 'bg-[#3083ff]' : 'bg-slate-200'}`} />
              <p className={`mt-1.5 text-center text-[10px] font-medium leading-tight lg:mt-2 lg:text-left lg:text-[10px] lg:font-black lg:uppercase lg:tracking-wider ${active ? 'font-semibold text-[#3083ff]' : done ? 'text-slate-600 lg:text-slate-400' : 'text-slate-400'}`}>
                <span className="lg:hidden">{label}</span>
                <span className="hidden lg:inline">{n}. {['Identify', 'Condition', 'Estimate', 'Photos', 'Confirm'][i]}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StepHeading({ step, title, desktopTitle, hint, desktopHint }) {
  return (
    <div>
      <div className="step-mobile-heading lg:hidden">
        <p className="text-[12px] font-semibold text-[#3083ff]">Step {step} of 5</p>
        <h2 className="mt-1 text-[18px] font-semibold leading-snug text-slate-900">{title}</h2>
        <p className="mt-1.5 text-[13px] font-normal leading-snug text-slate-500">{hint}</p>
      </div>
      <p className="hidden text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff] lg:block">Step {step} of 5</p>
      <h2 className="mt-1 hidden font-display text-3xl font-black leading-snug text-slate-900 lg:block">{desktopTitle || title}</h2>
      <p className="mt-2 hidden text-sm font-medium text-slate-500 lg:block">{desktopHint || hint}</p>
    </div>
  );
}

export function Sheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] md:hidden">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white border-t border-slate-200 p-5 shadow-2xl animate-fadeUp">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-black text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function MediaUrl({ src, alt, className }) {
  if (!src) return <div className={`bg-slate-100 ${className}`} />;
  return <img src={src} alt={alt || ''} className={className} />;
}
