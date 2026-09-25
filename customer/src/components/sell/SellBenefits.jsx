import { BadgeCheck, HandCoins, ShieldCheck, Timer } from 'lucide-react';

const BENEFITS = [
  { icon: Timer, title: 'Inspected in days, not months', body: 'Your request is queued for verified evaluation as soon as you book inspection.' },
  { icon: HandCoins, title: 'Estimate, then a real offer', body: 'The range you see first is indicative. The final offer comes after inspection.' },
  { icon: ShieldCheck, title: 'Paperwork handled', body: 'RC transfer, NOC and insurance transfer are managed by our team.' },
  { icon: BadgeCheck, title: 'Brand, mileage and condition', body: 'Valuation uses model, kilometres, brand index and the condition you report.' },
];

export default function SellBenefits() {
  return (
    <div>
      <div className="text-center max-w-2xl mx-auto mb-6 lg:mb-10">
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
          Why sell here
        </span>
        <h2 className="text-[20px] sm:text-4xl sm:uppercase tracking-tight font-display text-slate-800">
          Benefits of selling with <span className="font-black text-slate-900">4tyrezz</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed px-1">
          Same trust as our buy flow — inspected cars, clear offers, and support until handover.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5 shadow-sm"
          >
            <span className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-[#3083ff]/10 border border-[#3083ff]/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#3083ff]" strokeWidth={2.25} />
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm mt-3 lg:mt-4">{title}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
