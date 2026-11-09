const TONES = [
  'bg-[#e8f1ff] text-[#3083ff]',
  'bg-[#fff4e8] text-[#e07a12]',
  'bg-[#f3e8ff] text-[#7c3aed]',
  'bg-[#e8f8ef] text-[#178a45]',
];

export default function HowItWorks({ title = 'How does it work?', steps, action }) {
  return (
    <section className="px-4 pb-2 pt-4">
      <h2 className="text-base font-semibold text-slate-800 sm:text-lg">{title}</h2>
      <ol className="mt-4 grid grid-cols-2 gap-3 md:gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="rounded-2xl bg-white p-3 shadow-md shadow-slate-200/60">
              <div className="flex items-center justify-between gap-2">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${step.tone || TONES[index % TONES.length]}`}>
                  {Icon ? <Icon className="h-5 w-5" strokeWidth={2.25} /> : null}
                </span>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#3083ff] px-1.5 text-[11px] font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-snug text-slate-800">{step.title}</p>
              <p className="mt-1 text-[12px] font-normal leading-snug text-slate-500">{step.body}</p>
            </li>
          );
        })}
      </ol>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
