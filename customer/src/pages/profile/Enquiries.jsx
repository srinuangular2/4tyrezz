import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { StatusPill } from './hubUtils';

export default function Enquiries() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/user/enquiries').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  }, []);

  return (
    <ProfileCard eyebrow="Inbox" title="My enquiries">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading enquiries…</p>}
      {rows && rows.length === 0 && <EmptyNote>No seller, dealer or vehicle enquiries yet.</EmptyNote>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3">Vehicle / seller</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-3">
                    <p className="font-black text-slate-900">{row.title}</p>
                    {row.message && <p className="text-xs font-semibold text-slate-500 mt-0.5">{row.message}</p>}
                  </td>
                  <td className="py-3 pr-3 text-xs font-bold capitalize text-slate-600">{row.kind}</td>
                  <td className="py-3 pr-3"><StatusPill value={row.status} /></td>
                  <td className="py-3 text-xs font-semibold text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProfileCard>
  );
}
