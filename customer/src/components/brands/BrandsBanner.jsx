import { Car, GitCompare, Search, ShieldCheck } from 'lucide-react';

const POINTS = [
  { icon: Search, label: 'Pick your brand' },
  { icon: Car, label: 'See verified cars' },
  { icon: GitCompare, label: 'Compare models' },
  { icon: ShieldCheck, label: 'Buy with 4tyrezz' },
];

export default function BrandsBanner({ children }) {
  return (
    <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] lg:min-h-[540px]">
      <img
        src="/car-brands.png"
        alt="Browse used car brands on 4tyrezz"
        className="absolute inset-0 w-full h-full object-cover object-[85%_center] sm:object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06163a]/95 via-[#0b2a6e]/70 to-transparent sm:via-[#0b2a6e]/40 sm:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/10 sm:hidden" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
            All brands
          </span>

          <h1 className="text-3xl sm:text-5xl uppercase tracking-tight font-display text-white leading-tight">
            Find cars by <span className="font-black">the brand you trust</span>
          </h1>
          <p className="text-white/85 text-sm sm:text-base font-medium mt-4 max-w-md leading-relaxed">
            Search or tap a logo. You will see live, inspected used cars for that make on 4tyrezz.
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
