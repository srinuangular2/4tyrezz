import { ClipboardList, FileCheck2, IndianRupee, SearchCheck } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Enter RC or car details',
    body: 'Start with your registration number or pick brand, model and variant. We use that to identify the car quickly.',
  },
  {
    icon: IndianRupee,
    title: 'See an indicative estimate',
    body: 'Get a market range based on year, kilometres, condition and brand. This is a guide — not the final payout.',
  },
  {
    icon: SearchCheck,
    title: 'Book a doorstep inspection',
    body: 'Choose a slot. Our team checks the car in person so the offer matches real condition, not just photos.',
  },
  {
    icon: FileCheck2,
    title: 'Accept the offer. We handle paperwork',
    body: 'Once you agree, 4tyrezz manages RC transfer, NOC and insurance handover. You stay in control until you accept.',
  },
];

export default function WhySell4tyrezz() {
  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
      <div>
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
          Why 4tyrezz
        </span>
        <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display text-slate-800">
          How selling with <span className="font-black text-slate-900">4tyrezz</span> works
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-3 max-w-lg leading-relaxed">
          We buy through inspection, not through random buyer chats. You share the car, we evaluate, then you choose the offer.
        </p>

        <ol className="mt-8 space-y-5">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4">
              <div className="relative shrink-0">
                <span className="w-12 h-12 rounded-2xl bg-[#3083ff]/10 border border-[#3083ff]/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#3083ff]" strokeWidth={2.25} />
                </span>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3083ff] text-white text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div className="pt-0.5">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm font-bold text-slate-800">
          With 4tyrezz, selling is simpler — and the offer is based on a real inspection.
        </p>
      </div>

      <div className="relative">
        <div className="absolute -inset-3 rounded-[2rem] bg-[#3083ff]/10 blur-xl" aria-hidden />
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.12)] aspect-[4/3] lg:aspect-[5/4]">
          <img
            src="/sell-my-car.png"
            alt="4tyrezz inspection and handover"
            className="w-full h-full object-cover object-[78%_center]"
          />
        </div>
      </div>
    </div>
  );
}
