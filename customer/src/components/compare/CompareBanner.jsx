import { Gauge, IndianRupee, ShieldCheck, Star } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, label: 'Compare Features' },
  { icon: Gauge, label: 'Check Specifications' },
  { icon: IndianRupee, label: 'Get Best Prices' },
  { icon: Star, label: 'Make a Smart Choice' },
];

export default function CompareBanner({ children }) {
  return (
    <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] lg:min-h-[540px]">
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
            Find your <span className="font-black">perfect ride</span>
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
  );
}
