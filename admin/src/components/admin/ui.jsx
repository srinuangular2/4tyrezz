export const glass = 'bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.35)]';
export const glassIn = 'bg-slate-950/50 border border-slate-800/80 rounded-xl';
export const inputCls =
  'w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500/60';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.25)]';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-slate-800 text-slate-200 text-sm font-bold px-4 py-2.5 rounded-xl';

export function PageHeader({ kicker, title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && (
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-400">{kicker}</p>
        )}
        <h1 className="font-display font-black text-2xl text-white mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function GlassCard({ children, className = '' }) {
  return <div className={`${glass} rounded-2xl ${className}`}>{children}</div>;
}

export function StatusBadge({ value }) {
  const v = String(value || '—').toLowerCase();
  let cls = 'bg-slate-800 text-slate-300';
  if (/publish|approv|active|paid|resolved|sold|live/.test(v)) cls = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  else if (/pend|review|progress|requested|open/.test(v)) cls = 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
  else if (/reject|suspend|fail|refund|overdue|high/.test(v)) cls = 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {value || '—'}
    </span>
  );
}

export function KpiCard({ label, value, delta, hint }) {
  const up = Number(delta) > 0;
  const down = Number(delta) < 0;
  return (
    <div className={`${glass} rounded-2xl p-5`}>
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display text-3xl font-black text-white mt-2">{value}</p>
      {delta != null && (
        <p className={`text-xs font-bold mt-2 ${up ? 'text-emerald-400' : down ? 'text-rose-400' : 'text-slate-500'}`}>
          {up ? '+' : ''}{delta}% vs last month
        </p>
      )}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export function Drawer({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`h-full ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'} bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <h3 className="font-display font-bold text-xl text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white font-bold">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FilterPills({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
            value === opt.value
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function mediaSrc(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return src.startsWith('/') ? src : `/${src}`;
}
