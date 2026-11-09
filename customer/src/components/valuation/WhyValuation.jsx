import { ClipboardList, FileCheck2, IndianRupee, SearchCheck } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Enter RC or pick your car',
    body: 'Use the plate, or pick brand, model and year.',
  },
  {
    icon: IndianRupee,
    title: 'See an indicative SmartPrice',
    body: 'A market range from year, km, owners and city.',
  },
  {
    icon: SearchCheck,
    title: 'Share details if you want offers',
    body: 'Optional. You are not listed, and you do not have to sell.',
  },
  {
    icon: FileCheck2,
    title: 'Sell when you are ready',
    body: 'Book inspection and get a confirmed offer in person.',
  },
];

export default function WhyValuation() {
  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
      <div>
        <span className="mb-4 hidden items-center gap-2 rounded-full border border-[#3083ff]/20 bg-[#3083ff]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#3083ff] lg:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3083ff]" />
          Why 4tyrezz
        </span>
        <h2 className="text-base font-semibold text-slate-800 sm:text-lg lg:hidden">How does it work?</h2>
        <h2 className="hidden text-slate-800 lg:block lg:font-display lg:text-4xl lg:uppercase">How does it work?</h2>
        <p className="mt-2 hidden max-w-lg text-sm font-medium leading-relaxed text-slate-500 lg:block">
          Check what the market may pay before you sell. The number on screen is a guide. The real offer comes after inspection.
        </p>

        <ol className="mt-4 grid grid-cols-2 gap-3 md:gap-6 lg:hidden">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-2xl bg-white p-3 shadow-md shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${['bg-[#e8f1ff] text-[#3083ff]', 'bg-[#fff4e8] text-[#e07a12]', 'bg-[#f3e8ff] text-[#7c3aed]', 'bg-[#e8f8ef] text-[#178a45]'][i % 4]}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#3083ff] px-1.5 text-[11px] font-bold text-white">{i + 1}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold leading-snug text-slate-800">{title}</h3>
              <p className="mt-1 text-[12px] font-normal leading-snug text-slate-500">{body}</p>
            </li>
          ))}
        </ol>
        <ol className="mt-8 hidden space-y-5 lg:block">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={`${title}-desktop`} className="flex gap-4">
              <div className="relative shrink-0">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3083ff]/20 bg-[#3083ff]/10">
                  <Icon className="h-5 w-5 text-[#3083ff]" strokeWidth={2.25} />
                </span>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3083ff] text-[10px] font-black text-white">
                  {i + 1}
                </span>
              </div>
              <div className="pt-0.5">
                <h3 className="text-base font-extrabold leading-snug text-slate-900">{title}</h3>
                <p className="mt-0.5 text-sm font-medium leading-snug text-slate-500">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 hidden text-sm font-bold text-slate-800 lg:block">
          4tyrezz prices the same way our listing desk does — then confirms it on the ground.
        </p>
      </div>

      <div className="relative hidden lg:block">
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
