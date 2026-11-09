import { Gauge, IndianRupee, ShieldCheck, Star } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, label: 'Compare Features' },
  { icon: Gauge, label: 'Check Specifications' },
  { icon: IndianRupee, label: 'Get Best Prices' },
  { icon: Star, label: 'Make a Smart Choice' },
];

export default function CompareBanner({ children, hideMobile = false }) {
  return (
    <>
    <section className={`relative overflow-hidden lg:hidden ${hideMobile ? 'hidden' : ''}`}>
      <img src="/compare-cars.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[85%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061433]/90 via-[#061433]/68 to-[#061433]/42" />
      <div className="relative px-4 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/80">Compare cars</p>
        <h1 className="mt-1 max-w-[16rem] text-[15px] font-normal leading-snug text-white">
          Find your <span className="font-normal">perfect ride</span>
        </h1>
        <p className="mt-1 max-w-[18rem] text-xs font-light leading-snug text-white/90">Compare features, specs, and prices to choose the car that fits your lifestyle.</p>
        <div className="mt-3 grid max-w-[22rem] grid-cols-2 gap-x-2 gap-y-2.5">
          {POINTS.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 text-[12px] font-semibold text-white">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15">
                <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
              </span>
              {label}
            </span>
          ))}
        </div>
        {children}
      </div>
    </section>
    <section className="relative hidden overflow-hidden min-h-[420px] sm:min-h-[480px] lg:block lg:min-h-[540px]">
      <img
        src="/compare-cars.png"
        alt="Compare used cars on 4tyrezz"
        className="absolute inset-0 w-full h-full object-cover object-[72%_center] sm:object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b2a6e]/92 via-[#1853ff]/55 to-transparent sm:via-[#1853ff]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/10 sm:hidden" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
            Compare cars
          </span>

          <h1 className="text-3xl sm:text-5xl uppercase tracking-tight font-display text-white leading-tight">
            Find your <span className="font-bold">perfect ride</span>
          </h1>
          <p className="text-white/85 text-sm sm:text-base font-medium mt-4 max-w-md leading-relaxed">
            Compare features, specs, and prices to choose the car that fits your lifestyle.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-2 gap-y-3">
            {POINTS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                <span className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#9ad4ff]" strokeWidth={2.4} />
                </span>
                {label}
              </span>
            ))}
          </div>

          {children}
        </div>
      </div>
    </section>
    </>
  );
}
