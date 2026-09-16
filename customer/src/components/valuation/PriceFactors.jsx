import { Calendar, Droplets, Gauge, MapPin, Sparkles, Users } from 'lucide-react';

const FACTORS = [
  { icon: Calendar, title: 'Year & brand', body: 'Newer cars and in-demand brands hold value better than older or slow-selling models.' },
  { icon: Gauge, title: 'Kilometres driven', body: 'Higher running usually lowers the range. Honest KM helps you get a realistic figure.' },
  { icon: Users, title: 'Number of owners', body: 'First-owner cars typically score higher. Each extra owner trims the band a little.' },
  { icon: Droplets, title: 'Fuel & gearbox', body: 'Petrol, diesel, CNG, EV and manual vs automatic all shift demand in your city.' },
  { icon: MapPin, title: 'City demand', body: 'The same car can fetch more in a city where that model sells faster.' },
  { icon: Sparkles, title: 'Condition score', body: 'Scratches, service history and overall upkeep change the estimate before inspection.' },
];

export default function PriceFactors() {
  return (
    <div>
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
          Price factors
        </span>
        <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display text-slate-800">
          What decides your car’s <span className="font-black text-slate-900">value</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed">
          SmartPrice uses simple facts you already know. No jargon — just what buyers actually pay for.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FACTORS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#3083ff]/40 transition-colors"
          >
            <span className="w-11 h-11 rounded-xl bg-[#3083ff]/10 border border-[#3083ff]/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#3083ff]" strokeWidth={2.25} />
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm mt-4">{title}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
