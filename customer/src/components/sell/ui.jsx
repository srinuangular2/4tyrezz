export const sellFieldClass =
  'w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-[#3083ff] focus:ring-2 focus:ring-[#3083ff]/20 shadow-sm transition';

export const sellChipIdle =
  'bg-white border-slate-200 text-slate-700 hover:border-[#3083ff]';

export function Stepper({ step }) {
  const labels = ['Identify', 'Condition', 'Estimate', 'Confirm'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex-1 min-w-0">
            <div className={`h-1.5 rounded-full ${done || active ? 'bg-[#3083ff]' : 'bg-slate-200'}`} />
            <p className={`mt-2 text-[10px] font-black uppercase tracking-wider ${active ? 'text-[#3083ff]' : 'text-slate-400'}`}>
              {n}. {label}
            </p>
          </div>
        );
      })}
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
