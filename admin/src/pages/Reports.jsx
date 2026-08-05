import { useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');

  const load = () => api.get('/reports', { params: { status: status || undefined } }).then((r) => setReports(r.data));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const markReviewed = async (id) => { await api.patch(`/reports/${id}/reviewed`); load(); };

  const columns = [
    { key: 'car', label: 'Car', render: (r) => r.car?.title || '—' },
    { key: 'reason', label: 'Reason' },
    { key: 'message', label: 'Message', render: (r) => r.message || <span className="text-slate2 italic">—</span> },
    { key: 'reporter', label: 'Reported by', render: (r) => r.reporter?.name || r.reporter?.mobile || r.reporter?.email || 'Anonymous' },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={`text-xs font-bold px-2 py-1 rounded-md capitalize ${r.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-verify-bg text-verify'}`}>{r.status}</span>
    ) },
    { key: 'actions', label: 'Actions', render: (r) => (
      r.status === 'open' ? <button onClick={() => markReviewed(r._id)} className="text-verify text-xs font-bold">Mark reviewed</button> : null
    ) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-2xl">Reported Ads</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
        <option value="open">Open</option>
        <option value="reviewed">Reviewed</option>
        <option value="">All</option>
      </select>
      <DataTable columns={columns} rows={reports} page={1} pages={1} onPageChange={() => {}} />
    </div>
  );
}
