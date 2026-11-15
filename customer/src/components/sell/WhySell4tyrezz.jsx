import { ClipboardList, FileCheck2, HandCoins, IndianRupee, SearchCheck, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    short: 'Enter your car',
    title: 'Enter RC or car details',
    body: 'Type the plate number, or pick the brand if you don’t remember it.',
  },
  {
    icon: IndianRupee,
    short: 'See a price range',
    title: 'See an indicative estimate',
    body: 'This first number is a guide. The final offer is confirmed only after we see the car.',
  },
  {
    icon: SearchCheck,
    short: 'We inspect at your door',
    title: 'Book a doorstep inspection',
    body: 'Pick a time. Our team checks the car where it is parked. You don’t visit a yard.',
  },
  {
    icon: FileCheck2,
    short: 'Accept, we do the papers',
    title: 'Accept the offer. We handle paperwork',
    body: 'If the offer feels right, you accept. We handle the RC transfer and the documents.',
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
        <h2 className="text-[16px] font-semibold text-slate-900 lg:hidden">Why sell with 4tyrezz?</h2>
        <div className="mt-3 space-y-3 lg:hidden">
          {[
            { icon: HandCoins, title: 'A fair price after inspection', body: 'The first range is a guide. The offer comes after we see the car.' },
            { icon: ShieldCheck, title: 'We take care of the papers', body: 'RC transfer and documents stay with the 4tyrezz desk.' },
            { icon: SearchCheck, title: 'Same-day pickup when the slot fits', body: 'We inspect at your door. You do not visit a yard.' },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d7ebff] text-[#1d6fbe]">
                <Icon className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold leading-snug text-slate-900">{title}</h3>
                <p className="mt-0.5 text-[13px] font-normal leading-snug text-slate-500">{body}</p>
              </div>
            </article>
          ))}
        </div>
        <h2 className="mt-5 text-[16px] font-semibold text-slate-900 lg:hidden">Sell your car in 4 easy steps</h2>
        <h2 className="hidden text-slate-800 lg:block lg:font-display lg:text-4xl lg:uppercase">How does it work?</h2>
        <p className="mt-2 hidden max-w-lg text-sm font-medium leading-relaxed text-slate-500 lg:block">
          We buy through inspection, not through random buyer chats. You share the car, we evaluate, then you choose the offer.
        </p>

        <ol className="mt-3 lg:hidden">
          {STEPS.map(({ short, body }, i) => (
            <li key={short} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3083ff] text-[11px] font-bold text-white">{i + 1}</span>
                {i < STEPS.length - 1 ? <span className="my-1 w-px flex-1 bg-[#3083ff]/25" /> : null}
              </div>
              <div className={i < STEPS.length - 1 ? 'pb-4' : ''}>
                <p className="text-[13px] font-semibold leading-snug text-slate-900">{short}</p>
                <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">{body}</p>
              </div>
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
