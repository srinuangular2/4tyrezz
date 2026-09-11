import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Quoted', 'Closed', 'Rejected'];

export default function FinanceHub({ defaultType = 'finance' }) {
  const [tab, setTab] = useState(defaultType);
  const [rows, setRows] = useState(null);
  const [dealers, setDealers] = useState([]);

  const load = () => {
    api.get('/enquiries', { params: { type: tab, limit: 50 } })
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    api.get('/admin/users', { params: { role: 'dealer', limit: 100 } })
      .then((r) => setDealers(r.data.users || []))
      .catch(() => setDealers([]));
  }, []);

  const save = async (row, patch) => {
    try {
      await api.patch(`/enquiries/${row._id}`, patch);
      toast.success('Enquiry updated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-400">Lending desk</p>
        <h1 className="font-display font-black text-2xl mt-1 text-white">{defaultType === 'insurance' ? 'Insurance leads' : 'Finance leads'}</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">Assign incoming quotes to partner banks, insurers, or dealers.</p>
      </div>
      <div className="flex gap-2">
        {['finance', 'insurance'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-900/70 border border-slate-800 text-slate-400'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading…</p>}
      {rows && rows.length === 0 && <p className="text-sm font-semibold text-slate-500 py-10 text-center">No {tab} enquiries yet.</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr className="text-left">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Car</th>
                <th className="px-4 py-3">Bank / amount</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Assign dealer</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <p className="font-bold">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3">{r.vehicle?.title || `${r.brand || ''} ${r.model || ''}`.trim() || '—'}</td>
                  <td className="px-4 py-3">
                    {r.bankName || '—'}
                    {r.loanAmount ? ` · ₹${Number(r.loanAmount).toLocaleString('en-IN')}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold bg-transparent w-36"
                      defaultValue={r.partnerName || ''}
                      placeholder="Bank / insurer"
                      onBlur={(e) => {
                        if (e.target.value !== (r.partnerName || '')) save(r, { partnerName: e.target.value, status: r.status });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold bg-transparent"
                      value={r.assignedTo?._id || r.assignedTo || ''}
                      onChange={(e) => save(r, { assignedTo: e.target.value || null, status: e.target.value ? 'Assigned' : r.status })}
                    >
                      <option value="">Unassigned</option>
                      {dealers.map((d) => (
                        <option key={d._id} value={d._id}>{d.dealershipName || d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold bg-transparent"
                      value={r.status}
                      onChange={(e) => save(r, { status: e.target.value })}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
