import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { Drawer, FilterPills, PageHeader, StatusBadge, btnPrimary, inputCls } from '../components/admin/ui';

export default function Support() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('open');
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');

  const load = async (page = 1) => {
    const { data } = await api.get('/admin/support', { params: { page, limit: 20, status: status || undefined } });
    setRows(data.data || []);
    setMeta({ page: data.page, pages: data.totalPages || data.pages || 1 });
  };
  useEffect(() => { load(1); }, [status]);

  const send = async () => {
    await api.post(`/admin/support/${ticket._id}/reply`, { body: reply, status: 'in_progress' });
    toast.success('Reply sent');
    setReply('');
    const { data } = await api.get('/admin/support', { params: { page: meta.page, limit: 20, status: status || undefined } });
    const next = (data.data || []).find((t) => t._id === ticket._id);
    setTicket(next || ticket);
    load(meta.page);
  };

  const resolve = async () => {
    await api.patch(`/admin/support/${ticket._id}`, { status: 'resolved' });
    toast.success('Ticket resolved');
    setTicket(null);
    load(meta.page);
  };

  return (
    <div className="space-y-4">
      <PageHeader kicker="Help desk" title="Complaints & support" subtitle="Priority inbox with a live reply thread to the customer notification feed." />
      <FilterPills
        value={status}
        onChange={setStatus}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'resolved', label: 'Resolved' },
          { value: '', label: 'All' },
        ]}
      />
      <DataTable
        rows={rows}
        page={meta.page}
        pages={meta.pages}
        onPageChange={load}
        columns={[
          { key: 'subject', label: 'Subject' },
          { key: 'name', label: 'Customer' },
          { key: 'priority', label: 'Priority', render: (r) => <StatusBadge value={r.priority} /> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          { key: 'open', label: '', render: (r) => <button type="button" className="text-xs font-bold text-blue-400" onClick={() => { setTicket(r); setReply(''); }}>Open</button> },
        ]}
      />
      {ticket && (
        <Drawer title={ticket.subject} onClose={() => setTicket(null)}>
          <p className="text-sm text-slate-400">{ticket.name} · {ticket.email || ticket.phone}</p>
          <p className="text-sm text-white mt-3 whitespace-pre-line">{ticket.message}</p>
          <div className="mt-5 space-y-3">
            {(ticket.replies || []).map((r, i) => (
              <div key={i} className={`rounded-xl p-3 text-sm ${r.role === 'admin' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-900 border border-slate-800'}`}>
                <p className="text-[10px] font-black uppercase text-slate-500">{r.author} · {r.role}</p>
                <p className="mt-1">{r.body}</p>
              </div>
            ))}
          </div>
          <textarea className={`${inputCls} mt-4`} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" />
          <div className="flex gap-2 mt-3">
            <button type="button" className={btnPrimary} onClick={send}>Send reply</button>
            <button type="button" className="text-sm font-bold text-emerald-400" onClick={resolve}>Mark resolved</button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
