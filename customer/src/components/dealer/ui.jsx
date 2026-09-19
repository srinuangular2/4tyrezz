export const glass =
  'bg-white border border-slate-200/80 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.12)]';
export const inputCls =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#3083ff] focus:ring-2 focus:ring-[#3083ff]/20';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-[#3083ff] hover:bg-[#1853ff] text-white text-sm font-bold px-4 py-2.5 rounded-xl';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl';

export function PageHeader({ kicker, title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && (
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">{kicker}</p>
        )}
        <h1 className="font-display font-black text-2xl text-slate-900 mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
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
  let cls = 'bg-slate-100 text-slate-600';
  if (/publish|approv|active|paid|resolved|sold|live/.test(v)) cls = 'bg-emerald-50 text-emerald-700';
  else if (/pend|review|progress|requested|open/.test(v)) cls = 'bg-amber-50 text-amber-700';
  else if (/reject|suspend|fail|refund|overdue|high/.test(v)) cls = 'bg-rose-50 text-rose-700';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {value || '—'}
    </span>
  );
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-[#EAF2FF] text-[#1853ff]',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className={`${glass} rounded-2xl p-5 relative overflow-hidden`}>
      <div className="absolute inset-y-0 left-0 w-1 bg-[#3083ff]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="font-display text-3xl font-black text-slate-900 mt-2">{value}</p>
          {hint && <p className="text-[12px] font-semibold text-slate-500 mt-1.5">{hint}</p>}
        </div>
        {Icon && (
          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tones[tone] || tones.blue}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </div>
  );
}

export function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}
