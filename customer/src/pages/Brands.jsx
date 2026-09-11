import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Car } from 'lucide-react';
import useReferenceData from '../hooks/useReferenceData';
import { mediaUrl } from './profile/hubUtils';
import {
  EmptyState,
  PageHero,
  Section,
  Skeleton,
  inputClass,
} from '../components/PageShell';

export default function Brands() {
  const { brands, loading } = useReferenceData();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...(brands || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (!q) return list;
    return list.filter((b) => String(b.name || '').toLowerCase().includes(q));
  }, [brands, query]);

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Inventory"
        title="All brands"
        subtitle="Browse every make we list. Tap a brand to see live cars for that manufacturer."
      >
        <p className="text-white/60 text-sm font-bold mt-6">{brands.length || '—'} brands</p>
      </PageHero>

      <Section eyebrow="Browse" title="Choose a manufacturer">
        <div className="relative mb-8 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
          <input
            className={`${inputClass} pl-10`}
            placeholder="Search brand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visible.map((b) => (
              <Link
                key={b._id}
                to={`/cars?brand=${b._id}`}
                className="group relative flex flex-col items-center justify-center gap-3 p-5 h-32 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_16px_32px_0_rgba(37,99,235,0.18)] hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="h-10 w-full flex items-center justify-center">
                  {b.logo ? (
                    <img
                      src={mediaUrl(b.logo)}
                      alt={b.name}
                      className="max-h-10 max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-slate-900/5 border border-slate-900/10 flex items-center justify-center text-xs font-black text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      {String(b.name || '').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors duration-300 tracking-tight line-clamp-1">
                  {b.name}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Car}
            title={brands.length ? 'No brands match that search' : 'No brands listed yet'}
            body={brands.length ? 'Try a different name.' : 'Manufacturers appear here as inventory is added.'}
          />
        )}
      </Section>
    </div>
  );
}
