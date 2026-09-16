import { ClipboardList, FileCheck2, IndianRupee, SearchCheck } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Enter RC or pick your car',
    body: 'Use the registration number or choose brand, model, year and variant from our live catalogue.',
  },
  {
    icon: IndianRupee,
    title: 'See an indicative SmartPrice',
    body: 'We score year, kilometres, owners, city demand and condition into a market range — not a final payout.',
  },
  {
    icon: SearchCheck,
    title: 'Share details if you want offers',
    body: 'The 4tyrezz team uses your estimate to follow up. You are not listed publicly and you do not have to sell.',
  },
  {
    icon: FileCheck2,
    title: 'Sell when you are ready',
    body: 'Move to Sell your car, book inspection, and get a confirmed offer after we see the vehicle in person.',
  },
];

export default function WhyValuation() {
  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
      <div>
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
          Why 4tyrezz
        </span>
        <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display text-slate-800">
          How <span className="font-black text-slate-900">SmartPrice</span> works
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-3 max-w-lg leading-relaxed">
          Check what the market may pay before you sell. The number on screen is a guide. The real offer comes after inspection.
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
          4tyrezz prices the same way our listing desk does — then confirms it on the ground.
        </p>
      </div>

      <div className="relative">
        <div className="absolute -inset-3 rounded-[2rem] bg-[#3083ff]/10 blur-xl" aria-hidden />
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.12)] aspect-[4/3] lg:aspect-[5/4]">
          <img
            src="/car-valution.png"
            alt="4tyrezz inspection for used car valuation"
            className="w-full h-full object-cover object-[78%_center]"
          />
        </div>
      </div>
    </div>
  );
}
