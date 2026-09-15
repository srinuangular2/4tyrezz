import { Link } from 'react-router-dom';
import { formatINR } from './PageShell';

export function compareShortName(c) {
  return c.model || c.title?.split(' ').slice(-2).join(' ') || 'Car';
}

export default function CompareVsCard({ pair, onOpen, to }) {
  const [a, b] = pair.cars || [];
  if (!a || !b) return null;
  const label = `${compareShortName(a)} vs ${compareShortName(b)}`;
  const ctaClass =
    'w-full rounded-xl border-2 border-[#3083ff] text-[#3083ff] font-black text-xs uppercase tracking-wider py-2.5 hover:bg-[#3083ff] hover:text-white transition text-center block';

  return (
    <article className="h-full flex flex-col rounded-3xl bg-white/45 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_0_rgba(48,131,255,0.16)] transition-all duration-300">
      <div className="relative bg-gradient-to-b from-slate-100/80 to-white px-4 pt-6 pb-4">
        <div className="grid grid-cols-2 gap-1 items-end">
          <img src={a.images?.[0]} alt={a.title} className="h-24 sm:h-28 w-full object-cover" />
          <img src={b.images?.[0]} alt={b.title} className="h-24 sm:h-28 w-full object-cover" />
        </div>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#3083ff] text-white text-[11px] font-black flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white">
          VS
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 pt-2 pb-4">
        {[a, b].map((c) => (
          <div key={c.id}>
            <p className="text-[11px] font-bold text-slate-400 truncate">{c.brand}</p>
            <p className="font-black text-slate-900 text-sm truncate">{compareShortName(c)}</p>
            <p className="text-xs font-extrabold text-slate-700 mt-0.5">{formatINR(c.price)}</p>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5 mt-auto">
        {to ? (
          <Link to={to} className={ctaClass}>
            {label}
          </Link>
        ) : (
          <button type="button" onClick={onOpen} className={ctaClass}>
            {label}
          </button>
        )}
      </div>
    </article>
  );
}
