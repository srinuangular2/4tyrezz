import React from 'react';
import { SHOW_TEST_DRIVE } from '../lib/featureFlags';

export const STEPS = [
  {
    step: '01',
    header: 'Choose from certified cars',
    desc: 'Browse through thousands of fully inspected pre-owned cars online with transparent reports.',
    badge: 'Slot Booking',
    icon: (
      <svg className="w-10 h-10 text-[#3083ff] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
  {
    step: '02',
    header: SHOW_TEST_DRIVE ? 'Take a test drive at home' : 'Doorstep delivery & inspection',
    desc: SHOW_TEST_DRIVE
      ? 'Sanitized cars delivered right to your doorstep or available at our local delivery hubs.'
      : 'Sanitized cars inspected and delivered right to your doorstep or available at our local delivery hubs.',
    badge: '140-pt Inspection',
    icon: (
      <svg className="w-10 h-10 text-[#3083ff] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 9a3 3 0 100 6 3 3 0 000-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l-6 3m6-3l6 3m-6-3V3" />
      </svg>
    ),
  },
  {
    step: '03',
    header: 'Algorithmic inspection score',
    desc: 'Instant automated scoring evaluating engine health, chassis integrity, and electronics.',
    badge: 'Automated Score',
    icon: (
      <svg className="w-10 h-10 text-[#3083ff] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" />
      </svg>
    ),
  },
  {
    step: '04',
    header: 'Online payment & delivery',
    desc: 'Hassle-free digital payment options backed by our 7-day money-back guarantee.',
    badge: 'Digital Certificate',
    icon: (
      <svg className="w-10 h-10 text-[#3083ff] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12 0A2.25 2.25 0 0114.25 16.5h-9a2.25 2.25 0 01-2.25-2.25" />
      </svg>
    ),
  },
];

export default function VerificationProcessSection() {
  return (
    <section className="">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#3083ff]/15 text-[#3083ff] border border-[#3083ff]/40 backdrop-blur-md shadow-sm mb-3">
          <span className="w-2 h-2 rounded-full bg-[#3083ff] animate-pulse" />
          Quality First
        </span>
        <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display">
         How  <span  className='font-black text-slate-900'>  4tyrezz</span> Works
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mt-2">
          You won't just love our cars, you'll love the way you buy them.
        </p>
      </div>

      {/* High-Contrast Blue Glassmorphism Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map(({ step, header, desc, badge, icon }) => (
          <div
            key={step}
            className="group relative flex flex-col justify-between p-7 rounded-3xl bg-gradient-to-b from-blue-500/20 via-[#3083ff]/10 to-transparent dark:from-[#3083ff]/25 dark:via-blue-900/20 backdrop-blur-2xl border-2 border-[#3083ff]/40 hover:border-[#3083ff] shadow-[0_10px_30px_rgba(48,131,255,0.2)] hover:shadow-[0_20px_45px_rgba(48,131,255,0.4)] transition-all duration-300 hover:-translate-y-2 overflow-hidden"
          >
            {/* Top Solid Blue Glow Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-[#3083ff] to-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity" />

            <div>
              {/* Header Row */}
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-2xl bg-[#3083ff] text-white font-black text-xs flex items-center justify-center shadow-md shadow-[#3083ff]/40 group-hover:scale-110 transition-transform duration-300">
                  {step}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-200 bg-[#3083ff]/20 border border-[#3083ff]/40 px-3 py-1 rounded-full backdrop-blur-md">
                  {badge}
                </span>
              </div>

              {/* Glass Icon Container */}
              <div className="my-5 w-16 h-16 rounded-2xl bg-[#3083ff]/15 border border-[#3083ff]/30 flex items-center justify-center backdrop-blur-md group-hover:bg-[#3083ff]/25 group-hover:border-[#3083ff] transition-all duration-300">
                {icon}
              </div>

              {/* Title & Description */}
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                {header}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed font-semibold">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}