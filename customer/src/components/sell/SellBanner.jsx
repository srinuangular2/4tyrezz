import { IndianRupee, PhoneOff, ShieldCheck } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, label: 'Verified evaluation', hint: 'Inspection before a final offer' },
  { icon: IndianRupee, label: 'Fair market price', hint: 'Estimate first, then a real offer' },
  { icon: PhoneOff, label: 'Private selling', hint: 'You talk to 4tyrezz, not random callers' },
];

const STEPS = [
  { n: '01', title: 'Share car details' },
  { n: '02', title: 'Get an indicative estimate' },
  { n: '03', title: 'Book inspection & close' },
];

export default function SellBanner() {
  return (
    <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] lg:min-h-[540px]">
      <img
        src="/sell-my-car.png"
        alt="Sell your car with 4tyrezz"
        className="absolute inset-0 w-full h-full object-cover object-[72%_center] sm:object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b2a6e]/92 via-[#1853ff]/55 to-transparent sm:via-[#1853ff]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/10 sm:hidden" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
            Sell with 4tyrezz
          </span>

          <h1 className="text-3xl sm:text-5xl uppercase tracking-tight font-display text-white leading-tight">
            Sell your car the <span className="font-black">smart way</span>
          </h1>
          <p className="text-white/85 text-sm sm:text-base font-medium mt-4 max-w-md leading-relaxed">
            Instant estimate · Doorstep inspection · Fair final offer
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {POINTS.map(({ icon: Icon, label, hint }) => (
              <div
                key={label}
                className="flex sm:flex-col items-center sm:items-start gap-3 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 px-4 py-3.5"
              >
                <span className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-sm font-black text-white leading-snug">{label}</p>
                  <p className="text-[11px] font-semibold text-white/70 mt-0.5 leading-snug">{hint}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 rounded-2xl bg-white/95 border border-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.18)] px-4 py-3 sm:px-5">
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
