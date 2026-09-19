import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ProfileCard } from '../components/ui';

const BUYER_STATUSES = ['New', 'Contacted', 'Test Drive Scheduled', 'Closed'];
const FI_STATUSES = ['New', 'Assigned', 'In Progress', 'Quoted', 'Closed'];
const SELL_STATUSES = [
  'New',
  'Assigned',
  'Follow-up',
  'Inspection / Offer',
  'Purchased',
  'Exchanged',
  'Rejected',
  'Closed',
];

function inr(n) {
  if (n == null || n === '') return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function DealerLeads({ mode = 'buyer' }) {
  const [rows, setRows] = useState(null);
  const isFi = mode === 'finance';
  const isSeller = mode === 'seller';

  const load = () => {
    const url = isSeller ? '/dealer/leads/seller' : isFi ? '/dealer/leads/finance-insurance' : '/dealer/leads/buyer';
    api.get(url).then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  };

  useEffect(() => {
    load();
  }, [isFi, isSeller]);

  const update = async (row, status) => {
    try {
      await api.patch(`/dealer/leads/${row.id}`, { source: isSeller ? 'seller' : isFi ? row.type : row.source, status });
      toast.success('Status updated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update');
    }
  };

  const title = isSeller ? 'Sell / Exchange leads' : isFi ? 'Finance & insurance leads' : 'Buyer & test drive leads';
  const statuses = isSeller ? SELL_STATUSES : isFi ? FI_STATUSES : BUYER_STATUSES;

  return (
    <ProfileCard eyebrow="Pipeline" title={title}>
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading leads…</p>}
      {rows && rows.length === 0 && <p className="text-sm font-semibold text-slate-500 py-8 text-center">No leads yet.</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr className="text-left">
                <th className="py-2 pr-3">Lead ID</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Mobile</th>
                <th className="py-2 pr-3">Car</th>
                {isSeller && (
                  <>
                    <th className="py-2 pr-3">Intent</th>
                    <th className="py-2 pr-3">Estimate / expected</th>
                  </>
                )}
                {isFi ? (
                  <>
                    <th className="py-2 pr-3">Bank / amount</th>
                    <th className="py-2 pr-3">Tenure</th>
                    <th className="py-2 pr-3">CIBIL</th>
                    <th className="py-2 pr-3">Employment</th>
                  </>
                ) : !isSeller ? (
                  <th className="py-2 pr-3">Preferred</th>
                ) : null}
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.source || r.type}-${r.id}`} className="border-t border-slate-100">
                  <td className="py-3 pr-3 font-black text-slate-900">{r.leadId}</td>
                  <td className="py-3 pr-3">{r.customerName}</td>
                  <td className="py-3 pr-3">{r.mobile}</td>
                  <td className="py-3 pr-3">{r.carTitle || '—'}</td>
                  {isSeller && (
                    <>
                      <td className="py-3 pr-3 capitalize">{r.intent || 'sell'}</td>
                      <td className="py-3 pr-3">
                        {r.valuationPending || !r.estimatePrice ? 'Pending' : inr(r.estimatePrice)}
                        <span className="block text-[11px] text-slate-400">Expects {inr(r.expectedPrice)}</span>
                      </td>
                    </>
                  )}
                  {isFi ? (
                    <>
                      <td className="py-3 pr-3">{r.bankName || '—'} {r.loanAmount ? `· ₹${Number(r.loanAmount).toLocaleString('en-IN')}` : ''}</td>
                      <td className="py-3 pr-3">{r.tenureMonths ? `${r.tenureMonths} mo` : '—'}</td>
                      <td className="py-3 pr-3">{r.cibilBracket || '—'}</td>
                      <td className="py-3 pr-3">{r.employmentType || '—'}</td>
                    </>
                  ) : !isSeller ? (
                    <td className="py-3 pr-3">{r.preferredAt ? new Date(r.preferredAt).toLocaleString('en-IN') : '—'}{r.preferredTime ? ` ${r.preferredTime}` : ''}</td>
                  ) : null}
                  <td className="py-3">
                    <select
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                      value={r.status}
                      onChange={(e) => update(r, e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
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
