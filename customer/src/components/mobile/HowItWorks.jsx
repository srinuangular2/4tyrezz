const TONES = [
  'bg-[#e8f1ff] text-[#3083ff]',
  'bg-[#fff4e8] text-[#e07a12]',
  'bg-[#f3e8ff] text-[#7c3aed]',
  'bg-[#e8f8ef] text-[#1f9d6c]',
];

export default function HowItWorks({ title = 'How does it work?', steps, action }) {
  return (
    <section className="bg-white px-4 pb-2 pt-4">
      <h2 className="text-[16px] font-semibold tracking-tight text-slate-900">{title}</h2>
      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONES[index % TONES.length]}`}>
                {Icon ? <Icon className="h-4 w-4" strokeWidth={2} /> : <span className="text-[13px] font-semibold">{index + 1}</span>}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[13px] font-semibold leading-snug text-slate-900">{step.title}</p>
                <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
