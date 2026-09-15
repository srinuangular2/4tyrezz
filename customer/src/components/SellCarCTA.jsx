import { Link } from 'react-router-dom';

export default function SellCarCTA() {
  return (
    <section className="relative my-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c2e68] via-[#103e8c] to-[#0a234e] text-white shadow-[0_20px_50px_rgba(48,131,255,0.25)] border border-[#3083ff]/30">
      
      {/* Background Radial Glow Effects using #3083ff */}
      <div className="absolute -top-28 -left-28 h-96 w-96 rounded-full bg-[#3083ff]/30 blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-[110px] pointer-events-none" />

      {/* Top Beam Light Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-300 via-[#3083ff] to-indigo-400" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-12 items-center">
        
        {/* Left Content Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3083ff]/15 backdrop-blur-md border border-[#3083ff]/40 w-fit text-xs font-extrabold text-blue-200 uppercase tracking-widest shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#3083ff] animate-pulse" />
            Car Finance
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Drive home today. Pay easy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-[#3083ff] to-cyan-300">monthly EMIs.</span>
          </h2>

          <p className="text-blue-100/80 text-sm md:text-base leading-relaxed max-w-xl">
            Get used-car loans on inspected 4tyrezz cars. Fast approval, clear rates, and help from our finance team — no confusing paperwork.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/finance#apply"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#3083ff] hover:bg-[#2070f0] text-white font-extrabold text-sm shadow-[0_10px_30px_rgba(48,131,255,0.45)] hover:shadow-[0_15px_35px_rgba(48,131,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>Apply for Loan</span>
              <span className="font-black text-base group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>

            <Link
              to="/finance#emi-calculator"
              className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white font-bold text-sm transition-all duration-300"
            >
              Check EMI
            </Link>
          </div>
        </div>

        {/* Right Glassmorphic Cards Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#3083ff]/10 backdrop-blur-xl border border-[#3083ff]/30 shadow-lg hover:bg-[#3083ff]/20 hover:border-[#3083ff]/60 transition-all duration-300 flex flex-col justify-between h-36 group">
            <div className="w-10 h-10 rounded-xl bg-[#3083ff]/25 border border-[#3083ff]/40 flex items-center justify-center text-blue-200 font-black group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <div>
              <h3 className="text-white font-extrabold text-base">Fast approval</h3>
              <p className="text-blue-200/60 text-xs mt-0.5">Decision in 24–48 hours</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#3083ff]/10 backdrop-blur-xl border border-[#3083ff]/30 shadow-lg hover:bg-[#3083ff]/20 hover:border-[#3083ff]/60 transition-all duration-300 flex flex-col justify-between h-36 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-black group-hover:scale-110 transition-transform">
              💳
            </div>
            <div>
              <h3 className="text-white font-extrabold text-base">Up to 90% funding</h3>
              <p className="text-blue-200/60 text-xs mt-0.5">Finance most of the car price</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#3083ff]/10 backdrop-blur-xl border border-[#3083ff]/30 shadow-lg hover:bg-[#3083ff]/20 hover:border-[#3083ff]/60 transition-all duration-300 flex flex-col justify-between h-36 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-black group-hover:scale-110 transition-transform">
              🏠
            </div>
            <div>
              <h3 className="text-white font-extrabold text-base">Clear rates</h3>
              <p className="text-blue-200/60 text-xs mt-0.5">No hidden charges</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#3083ff]/10 backdrop-blur-xl border border-[#3083ff]/30 shadow-lg hover:bg-[#3083ff]/20 hover:border-[#3083ff]/60 transition-all duration-300 flex flex-col justify-between h-36 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-black group-hover:scale-110 transition-transform">
              📋
            </div>
            <div>
              <h3 className="text-white font-extrabold text-base">Simple documents</h3>
              <p className="text-blue-200/60 text-xs mt-0.5">PAN, Aadhaar & bank proof</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}