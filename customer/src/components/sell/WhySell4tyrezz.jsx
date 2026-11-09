import { ClipboardList, FileCheck2, IndianRupee, SearchCheck } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Enter RC or car details',
    body: 'Share the number plate, or pick brand and model.',
  },
  {
    icon: IndianRupee,
    title: 'See an indicative estimate',
    body: 'A market range. The final offer comes after inspection.',
  },
  {
    icon: SearchCheck,
    title: 'Book a doorstep inspection',
    body: 'We check the car at your door before quoting.',
  },
  {
    icon: FileCheck2,
    title: 'Accept the offer. We handle paperwork',
    body: 'Agree, and we handle RC, NOC and insurance.',
  },
];

export default function WhySell4tyrezz() {
  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-14 items-center">
      <div>
        <span className="mb-4 hidden items-center gap-2 rounded-full border border-[#3083ff]/20 bg-[#3083ff]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#3083ff] lg:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3083ff]" />
          Why 4tyrezz
        </span>
        <h2 className="text-base font-semibold text-slate-800 sm:text-lg">How does it work?</h2>
        <p className="mt-1 hidden max-w-lg text-sm font-medium leading-relaxed text-slate-500 lg:block">
          We buy through inspection, not through random buyer chats.
        </p>

        <ol className="mt-4 grid grid-cols-2 gap-3 md:gap-6">
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

        <p className="mt-6 hidden text-sm font-bold text-slate-800 lg:block">
          With 4tyrezz, selling is simpler — and the offer is based on a real inspection.
        </p>
      </div>

      <div className="relative hidden lg:block">
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
