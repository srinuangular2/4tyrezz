import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #3083ff22 0%, transparent 50%)' }} />
      <div className="relative mx-auto w-full min-w-0 max-w-xl px-4 py-4 sm:px-6 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3083ff]">Customer access</p>
        <h1 className="mt-1 text-[22px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl sm:font-black">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-slate-500 sm:text-sm">{subtitle}</p>}
        <div className="mt-4 min-w-0 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(48,131,255,0.1)] sm:mt-8 sm:p-9">
          {children}
        </div>
        <p className="text-center text-sm font-semibold text-slate-500 mt-6">
          Dealer? <Link to="/dealer/login" className="text-[#3083ff] font-black hover:underline">Sign in with Dealer ID</Link>
        </p>
      </div>
    </div>
  );
}
