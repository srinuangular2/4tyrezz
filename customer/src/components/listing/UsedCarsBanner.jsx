import { BadgeCheck, IndianRupee, PhoneOff, ShieldCheck } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, label: 'Inspected listings' },
  { icon: BadgeCheck, label: 'Verified details' },
  { icon: IndianRupee, label: 'Fair asking prices' },
  { icon: PhoneOff, label: 'Talk to 4tyrezz' },
];

export default function UsedCarsBanner() {
  return (
    <section className="relative overflow-hidden min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]">
      <img
        src="/used-cars.png"
        alt="Buy inspected used cars on 4tyrezz"
        className="absolute inset-0 w-full h-full object-cover object-[80%_center] sm:object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061a4a]/88 via-[#1853ff]/40 to-transparent sm:via-[#1853ff]/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/10 sm:hidden" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
            Buy used cars
          </span>

          <h1 className="text-3xl sm:text-5xl uppercase tracking-tight font-display text-white leading-tight">
            Used cars <span className="font-black">near you</span>
          </h1>
          <p className="text-white/85 text-sm sm:text-base font-medium mt-4 max-w-md leading-relaxed">
            Inspected listings · Clear price · You talk to 4tyrezz, not random sellers
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
        </div>
      </div>
    </section>
  );
}
