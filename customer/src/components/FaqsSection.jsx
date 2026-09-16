import React from 'react';

export const DEFAULT_FAQS = [
  {
    q: 'How does the 140-point vehicle inspection work?',
    a: 'Every certified used car undergoes a rigorous inspection covering engine health, transmission, brake wear, electrical systems, chassis integrity, and digital odometer verification before listing.',
  },
  {
    q: 'Can I sell my car directly to a buyer or dealer?',
    a: 'Yes! You can list your car directly to retail buyers (C2C) or request an instant home evaluation to receive competitive cash offers from verified local dealers (C2B).',
  },
  {
    q: 'Are all listed used cars verified with service history?',
    a: 'Yes, every listing includes a transparent inspection score badge, verified seller credentials, and complete non-accidental/non-flooded history checks.',
  },
  {
    q: 'How long does used car loan approval take?',
    a: 'With our digital banking partners, pre-approved used car loans are processed within 4 to 24 hours with minimal documentation and zero hidden charges.',
  },
  {
    q: 'Who handles the RC transfer and paperwork?',
    a: 'Our dedicated documentation team manages the entire RC (Registration Certificate) transfer process, insurance transfer, and NOC issuance from start to finish.',
  },
  {
    q: 'Is there a money-back guarantee or warranty included?',
    a: 'All certified cars come with a 7-day money-back guarantee and a 1-year complimentary warranty covering major engine and gearbox components.',
  },
];

export default function FAQSection({
  faqs = DEFAULT_FAQS,
  subtitle = 'Everything you need to know about buying, selling, financing, and inspecting used cars.',
  layout = 'grid',
}) {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
          Help Center
        </span>
        <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display">
          Frequently Asked <span className='font-black text-slate-900'>Questions</span> 
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {subtitle}
        </p>
      </div>

      <div className={layout === 'stack' ? 'max-w-3xl mx-auto space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start'}>
        {faqs.map((f, index) => (
          <details
            key={f.q || index}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#3083ff]/40 transition-all cursor-pointer [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="font-extrabold text-slate-900 dark:text-white flex justify-between items-center text-sm sm:text-base gap-4 select-none">
              <span>{f.q}</span>
              <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-open:bg-[#3083ff] group-open:text-white flex items-center justify-center text-slate-700 dark:text-slate-300 font-black text-base transition-all shrink-0 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 leading-relaxed font-medium">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}