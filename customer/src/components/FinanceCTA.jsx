import React from 'react';
import { Link } from 'react-router-dom';

export default function FinanceCTA() {
  return (
    <>
  

 

 


<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3083ff] via-[#1265db] to-[#061d4b] text-white border border-[#3083ff]/30 shadow-[0_20px_50px_rgba(48,131,255,0.15)]">
      {/* Background Radial Glow Effects */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#3083ff]/30 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Decorative Diagonal Geometric Lines Accent (Right Side) */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 pointer-events-none overflow-hidden z-0">
        <div className="absolute -right-16 -top-20 h-[600px] w-48 rotate-[25deg] border-l border-r border-white/10 z-10" />
        <div className="absolute right-24 -top-20 h-[600px] w-28 rotate-[25deg] bg-gradient-to-b from-white/10 to-transparent z-10" />
        <div className="absolute right-60 -top-20 h-[600px] w-12 rotate-[25deg] bg-white/5 z-10" />
        <div className="absolute right-80 -top-20 h-[600px] w-px rotate-[25deg] bg-[#3083ff]/30 z-10" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-2 items-center">
        {/* Left Column: Heading & Value Proposition */}
        <div className="lg:col-span-7 flex flex-col gap-2">
            <div className='p-8 md:py-12 px-8'>
          <span className="inline-flex items-center gap-2 self-start text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-[#3083ff]/20 text-cyan-300 border border-[#3083ff]/40">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Insurance Enquiries
          </span>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Get the right car insurance. Without the confusion.
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
            Third-party, comprehensive, or zero-dep — we help you compare options and raise an enquiry. Our desk shares firm quotes from licensed partners.
          </p>

          {/* Quick Value Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/60 max-w-lg">
            <div>
              <p className="text-xs uppercase font-extrabold text-slate-400">Cover types</p>
              <p className="text-lg font-black text-cyan-300">Third-party to Zero Dep</p>
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold text-slate-400">Quotes</p>
              <p className="text-lg font-black text-white">From licensed insurers</p>
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold text-slate-400">Help</p>
              <p className="text-lg font-black text-white">Claim assistance</p>
            </div>
          </div>
        </div>
        </div>

        {/* Right Column: Interactive CTA Card */}
        <div className="lg:col-span-5"> 
<div className='p-8 md:py-12 px-8'>
          <div className="p-6 md:p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">Get an insurance quote</h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Free enquiry
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Tell us your car details. We’ll share quote options and call you back.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/insurance"
                className="flex-1 text-center py-3 px-5 rounded-xl bg-[#3083ff] hover:bg-[#2070f0] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Quote
              </Link>
              <Link
                to="/insurance"
                className="flex-1 text-center py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 font-extrabold text-xs uppercase tracking-wider backdrop-blur-md transition-all duration-300"
              >
                View plans
              </Link>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              *Quotes are indicative. Final premium depends on IDV, NCB, and insurer rules.
            </p>
          </div>
        </div>
        </div>
         
        </div>
       
     
    </section>
</>
  );
}