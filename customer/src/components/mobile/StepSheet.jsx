import { X } from 'lucide-react';

export default function StepSheet({ open, title, step, total = 3, onClose, onBack, onNext, nextLabel = 'Continue', busy, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Close" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-5 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3083ff]">Step {step} of {total}</p>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#3083ff]" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex gap-2">
          {step > 1 ? (
            <button type="button" onClick={onBack} className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
              Back
            </button>
          ) : null}
          <button type="button" onClick={onNext} disabled={busy} className="h-11 flex-[2] rounded-xl bg-[#3083ff] text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Please wait…' : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
