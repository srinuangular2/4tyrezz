import { IndianRupee, PhoneOff, ShieldCheck } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, label: 'Verified evaluation' },
  { icon: IndianRupee, label: 'Fair market price' },
  { icon: PhoneOff, label: 'Private selling' },
];

const STEPS = [
  { n: '01', title: 'Share car details' },
  { n: '02', title: 'Get an estimate' },
  { n: '03', title: 'Book inspection' },
];

export default function SellBanner() {
  return (
    <section className="relative overflow-hidden min-h-[200px] sm:min-h-[420px] lg:min-h-[540px]">
      <img
        src="/sell-my-car.png"
        alt="Sell your car with 4tyrezz"
        className="absolute inset-0 w-full h-full object-cover object-[72%_center] sm:object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b2a6e]/92 via-[#1853ff]/55 to-transparent sm:via-[#1853ff]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/10 sm:hidden" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-16 lg:py-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md mb-2.5 sm:mb-5">
            <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
            Sell with 4tyrezz
          </span>

          <h1 className="text-xl sm:text-5xl sm:uppercase tracking-tight font-display text-white leading-tight">
            Sell your car the <span className="font-black">smart way</span>
          </h1>
          <p className="text-white/85 text-xs sm:text-base font-medium mt-2 sm:mt-4 max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none">
            Instant estimate · Doorstep inspection · Fair final offer
          </p>

          {/* Mobile: compact 3-point row */}
          <div className="mt-3 sm:hidden grid grid-cols-3 gap-1.5">
            {POINTS.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-white/12 border border-white/20 px-1.5 py-2 text-center">
                <Icon className="w-4 h-4 text-white mx-auto" strokeWidth={2.25} />
                <p className="text-[9px] font-bold text-white mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Desktop: full point cards */}
          <div className="mt-8 hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-3">
            {POINTS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex sm:flex-col items-center sm:items-start gap-3 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 px-4 py-3.5"
              >
                <span className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
                </span>
                <p className="text-sm font-black text-white leading-snug">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 sm:hidden flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {STEPS.map(({ n, title }) => (
              <div
                key={n}
                className="shrink-0 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 border border-white/80"
              >
                <span className="w-6 h-6 rounded-full bg-[#3083ff] text-white text-[10px] font-black flex items-center justify-center">
                  {n}
                </span>
                <p className="text-[11px] font-bold text-slate-800 whitespace-nowrap">{title}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 sm:mt-8 hidden sm:flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 rounded-2xl bg-white/95 border border-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.18)] px-4 py-3 sm:px-5">
            {STEPS.map(({ n, title }, i) => (
              <div key={n} className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-8 h-8 rounded-full bg-[#3083ff] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                  {n}
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">{title}</p>
                {i < STEPS.length - 1 && (
                  <span className="hidden sm:block mx-3 text-[#3083ff] font-black shrink-0" aria-hidden>
                    ›
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
