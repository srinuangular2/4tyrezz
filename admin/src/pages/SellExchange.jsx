import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const PIPELINE = [
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

export default function SellExchange() {
  const [rows, setRows] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [intent, setIntent] = useState('');

  const load = () => {
    api
      .get('/enquiries', { params: { type: 'seller', intent: intent || undefined, limit: 50 } })
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    load();
  }, [intent]);

  useEffect(() => {
    api
      .get('/admin/users', { params: { role: 'dealer', limit: 100 } })
      .then((r) => setDealers(r.data.users || r.data.data || []))
      .catch(() => setDealers([]));
  }, []);

  const save = async (row, patch) => {
    try {
      await api.patch(`/enquiries/${row._id}`, patch);
      toast.success('Lead updated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-400">Sell desk</p>
        <h1 className="font-display font-black text-2xl mt-1 text-white">Sell / Exchange leads</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Customer submissions with indicative estimates. Assign a dealer, then move Follow-up → Inspection / Offer → Purchased, Exchanged, Rejected or Closed.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['', 'sell', 'exchange', 'both'].map((t) => (
          <button
            key={t || 'all'}
            type="button"
            onClick={() => setIntent(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
              intent === t ? 'bg-blue-600 text-white' : 'bg-slate-900/70 border border-slate-800 text-slate-400'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading…</p>}
      {rows && rows.length === 0 && (
        <p className="text-sm font-semibold text-slate-500 py-10 text-center">No sell / exchange leads yet.</p>
      )}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr className="text-left">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Estimate / expected</th>
                <th className="px-4 py-3">Inspection</th>
                <th className="px-4 py-3">Assign dealer</th>
                <th className="px-4 py-3">Stage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-slate-800">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.phone}</p>
                    <p className="text-[10px] font-black uppercase text-blue-400 mt-1">{r.intent || 'sell'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-200">
                      {[r.year, r.brand, r.model, r.variant].filter(Boolean).join(' ') || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.registrationNumber || '—'} {r.city ? `· ${r.city}` : ''}
                    </p>
                    {r.photos?.length ? (
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">{r.photos.length} photos</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-200">
                      {r.valuationPending || !r.estimatePrice ? 'Pending' : inr(r.estimatePrice)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Band {inr(r.minPrice)} – {inr(r.maxPrice)}
                    </p>
                    <p className="text-xs text-slate-400">Expects {inr(r.expectedPrice)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-400">
                    {r.inspectionType || '—'}
                    <br />
                    {r.inspectionDate} {r.inspectionSlot}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold bg-transparent text-slate-200"
                      value={r.assignedTo?._id || r.assignedTo || ''}
                      onChange={(e) => save(r, { assignedTo: e.target.value || null })}
                    >
                      <option value="">Unassigned (admin queue)</option>
                      {dealers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.dealershipName || d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold bg-transparent text-slate-200"
                      value={r.status}
                      onChange={(e) => save(r, { status: e.target.value })}
                    >
                      {PIPELINE.map((s) => (
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
    </div>
  );
}
