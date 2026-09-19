export function ProfileCard({ title, eyebrow, children, action }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3083ff]">{eyebrow}</p>}
          {title && <h1 className="font-display font-black text-2xl text-slate-900 tracking-tight mt-1">{title}</h1>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200/70 rounded-2xl ${className}`} />;
}
