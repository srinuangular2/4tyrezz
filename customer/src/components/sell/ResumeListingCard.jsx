import { CarFront } from 'lucide-react';

export default function ResumeListingCard({
  title = 'Welcome back',
  subtitle = 'Thanks for sharing the details',
  year,
  brand,
  model,
  variant,
  kmDriven,
  fuel,
  city,
  plate,
  resumeLabel = 'Resume editing',
  newLabel = 'Start a new listing',
  onResume,
  onNew,
}) {
  const headline = [year, brand, model, variant].filter(Boolean).join(' ');
  const meta = [
    kmDriven ? `${Number(kmDriven).toLocaleString('en-IN')} km` : null,
    fuel,
    city,
    plate,
  ].filter(Boolean);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">{title}</p>
      <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">{subtitle}</h2>
      <div className="mt-6 flex gap-4 items-start rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
        <div className="w-12 h-12 rounded-xl bg-[#EAF2FF] flex items-center justify-center shrink-0">
          <CarFront className="w-6 h-6 text-[#3083ff]" strokeWidth={2.1} />
        </div>
        <div>
          <p className="font-display font-black text-slate-900 leading-snug">{headline || 'Your car'}</p>
          {meta.length > 0 && (
            <p className="text-sm font-semibold text-slate-500 mt-1">{meta.join(' · ')}</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onResume}
          className="bg-[#3083ff] hover:bg-[#1853ff] text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl"
        >
          {resumeLabel}
        </button>
        <button
          type="button"
          onClick={onNew}
          className="border border-slate-200 bg-white text-slate-800 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl"
        >
          {newLabel}
        </button>
      </div>
    </div>
  );
}
