import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { mediaUrl } from './hubUtils';

const ROWS = [
  ['Price', (c) => formatINR(c.price)],
  ['Year', (c) => c.year ?? '—'],
  ['Kilometres', (c) => (c.kmDriven != null ? `${Number(c.kmDriven).toLocaleString('en-IN')} km` : '—')],
  ['Fuel', (c) => c.fuel || '—'],
  ['Transmission', (c) => c.transmission || '—'],
  ['Engine', (c) => (c.engineDisplacement ? `${c.engineDisplacement} cc` : '—')],
  ['Owners', (c) => c.ownership || '—'],
  ['Body', (c) => c.bodyType || '—'],
];

export default function Comparisons() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/user/comparisons').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  }, []);

  const remove = async (id) => {
    try {
      await api.delete(`/user/comparisons/${id}`);
      setRows((list) => (list || []).filter((r) => r._id !== id));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not remove comparison');
    }
  };

  return (
    <ProfileCard eyebrow="Garage" title="My comparisons">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading comparisons…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          No saved matchups.{' '}
          <Link to="/compare" className="text-[#3083ff] font-black">Compare cars</Link>
        </EmptyNote>
      )}
      <div className="space-y-6">
        {(rows || []).map((row) => {
          const cars = row.vehicles || [];
          const ids = cars.map((c) => c._id).filter(Boolean).join(',');
          return (
            <div key={row._id}>
            <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:hidden">
              <div className="flex items-start justify-between gap-3 px-3.5 pt-3.5">
                <p className="min-w-0 text-[13px] font-semibold leading-snug text-slate-900">{row.name || 'Comparison'}</p>
                <div className="flex shrink-0 gap-3">
                  {ids && <Link to={`/compare?ids=${ids}`} className="text-[12px] font-semibold text-[#3083ff]">Open</Link>}
                  <button type="button" onClick={() => remove(row._id)} className="text-[12px] font-semibold text-rose-500">Remove</button>
                </div>
              </div>
              <div className={cars.length > 2 ? 'mt-3 overflow-x-auto' : 'mt-3'}>
                <div style={cars.length > 2 ? { minWidth: cars.length * 148 } : undefined}>
                  <div
                    className="relative grid gap-2 px-3.5"
                    style={{ gridTemplateColumns: `repeat(${Math.max(cars.length, 1)}, minmax(0, 1fr))` }}
                  >
                    {cars.map((c) => (
                      <div key={c._id} className="min-w-0">
                        <div className="h-[92px] overflow-hidden rounded-xl bg-slate-100">
                          {c.images?.[0] ? (
                            <img src={mediaUrl(c.images[0])} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-snug text-slate-900">{c.title}</p>
                      </div>
                    ))}
                    {cars.length === 2 && (
                      <span className="pointer-events-none absolute left-1/2 top-[46px] z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#3083ff] text-[9px] font-bold text-white ring-2 ring-white">
                        VS
                      </span>
                    )}
                  </div>
                  <div className="mt-3 border-t border-slate-100">
                    {ROWS.map(([label, fn], index) => (
                      <div
                        key={label}
                        className={`grid items-baseline ${index % 2 ? 'bg-slate-50' : ''}`}
                        style={{ gridTemplateColumns: `4.75rem repeat(${Math.max(cars.length, 1)}, minmax(0, 1fr))` }}
                      >
                        <p className="px-3.5 py-2 text-[11px] font-medium text-slate-400">{label}</p>
                        {cars.map((c) => (
                          <p
                            key={`${c._id}-${label}`}
                            className={`px-2 py-2 text-[12px] leading-snug ${label === 'Price' ? 'font-bold text-[#1853ff]' : 'font-semibold text-slate-800'}`}
                          >
                            {fn(c)}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <article className="hidden lg:block rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-50">
                <p className="font-semibold text-slate-900 text-[13px]">{row.name || 'Comparison'}</p>
                <div className="flex gap-3">
                  {ids && <Link to={`/compare?ids=${ids}`} className="text-[12px] font-semibold text-[#3083ff]">Open</Link>}
                  <button type="button" onClick={() => remove(row._id)} className="text-[12px] font-semibold text-rose-500">Remove</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-[10px] font-black uppercase text-slate-400">Spec</th>
                      {cars.map((c) => (
                        <th key={c._id} className="p-3 text-left">
                          <img src={mediaUrl(c.images?.[0])} alt="" className="h-16 w-full object-cover rounded-xl bg-slate-100 mb-2" />
                          <p className="font-black text-slate-900">{c.title}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map(([label, fn]) => (
                      <tr key={label} className="border-t border-slate-100">
                        <td className="p-3 text-xs font-bold text-slate-500">{label}</td>
                        {cars.map((c) => (
                          <td key={`${c._id}-${label}`} className="p-3 font-extrabold text-slate-800">{fn(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            </div>
          );
        })}
      </div>
    </ProfileCard>
  );
}
