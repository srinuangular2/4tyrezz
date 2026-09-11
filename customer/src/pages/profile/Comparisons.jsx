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
            <article key={row._id} className="rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-50">
                <p className="font-black text-slate-900 text-sm">{row.name || 'Comparison'}</p>
                <div className="flex gap-3">
                  {ids && <Link to={`/compare?ids=${ids}`} className="text-[11px] font-black text-[#3083ff]">Open</Link>}
                  <button type="button" onClick={() => remove(row._id)} className="text-[11px] font-black text-rose-600">Remove</button>
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
          );
        })}
      </div>
    </ProfileCard>
  );
}
