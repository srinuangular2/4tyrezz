import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Leads() {
  const [leads, setLeads] = useState(null);
  useEffect(() => { api.get('/leads/mine').then((r) => setLeads(r.data)).catch(() => setLeads([])); }, []);

  if (!leads) return <p className="text-slate2 text-sm">Loading…</p>;
  if (leads.length === 0) return <p className="text-slate2 text-sm">No leads yet — they'll show up here when a buyer contacts you about a listing.</p>;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100">
      {leads.map((l) => (
        <div key={l._id} className="p-4 flex justify-between items-start gap-4">
          <div>
            <p className="font-semibold text-sm">{l.name} <span className="text-slate2 font-normal">· {l.phone}</span></p>
            <p className="text-sm text-slate2 mt-1">{l.message || 'No message left.'}</p>
            <p className="text-xs text-slate-400 mt-1">Re: {l.car?.title}</p>
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(l.createdAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
