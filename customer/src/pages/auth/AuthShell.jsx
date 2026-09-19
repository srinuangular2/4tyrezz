import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #3083ff22 0%, transparent 50%)' }} />
      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#3083ff]">Customer access</p>
        <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight mt-2">{title}</h1>
        {subtitle && <p className="text-sm font-medium text-slate-500 mt-2">{subtitle}</p>}
        <div className="mt-8 bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_20px_40px_0_rgba(48,131,255,0.12)] p-7 sm:p-9">
          {children}
        </div>
        <p className="text-center text-sm font-semibold text-slate-500 mt-6">
          Dealer? <Link to="/dealer/login" className="text-[#3083ff] font-black hover:underline">Sign in with Dealer ID</Link>
        </p>
      </div>
    </div>
  );
}
