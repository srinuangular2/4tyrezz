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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-3xl sm:p-8">
      <p className="text-[12px] font-medium text-[#3083ff]">{title}</p>
      <h2 className="mt-1 text-[18px] font-semibold text-slate-900 sm:font-display sm:text-3xl sm:font-black">{subtitle}</h2>
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3 sm:mt-6 sm:gap-4 sm:px-4 sm:py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] sm:h-12 sm:w-12">
          <CarFront className="h-5 w-5 text-[#3083ff] sm:h-6 sm:w-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-snug text-slate-900 sm:font-display sm:font-black">{headline || 'Your car'}</p>
          {meta.length > 0 && (
            <p className="mt-1 text-[12px] font-normal text-slate-500 sm:text-sm sm:font-semibold">{meta.join(' · ')}</p>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
        <button
          type="button"
          onClick={onResume}
          className="rounded-xl bg-[#3083ff] px-3 py-3 text-[13px] font-semibold text-white hover:bg-[#1853ff] sm:px-6 sm:py-3.5 sm:text-xs sm:font-black sm:uppercase sm:tracking-wider"
        >
          {resumeLabel}
        </button>
        <button
          type="button"
          onClick={onNew}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold text-slate-700 sm:px-6 sm:py-3.5 sm:text-xs sm:font-black sm:uppercase sm:tracking-wider sm:text-slate-800"
        >
          {newLabel}
        </button>
      </div>
    </div>
  );
}
