import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { PageHeader, StatusBadge } from '../components/admin/ui';

const STATUSES = ['PAYMENT_PENDING', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function PdiAdmin() {
  const [rows, setRows] = useState([]);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [active, setActive] = useState(null);

  const load = () => api.get('/pdi/bookings').then((res) => setRows(res.data.data || [])).catch(() => setRows([]));

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => rows.filter((row) => (
    (!type || row.pdiType === type) && (!status || row.status === status)
  )), [rows, type, status]);

  const updateStatus = async (row, next) => {
    try {
      await api.patch(`/pdi/bookings/${row._id}/status`, { status: next });
      toast.success('Lead updated');
      setRows((list) => list.map((item) => (item._id === row._id ? { ...item, status: next } : item)));
      if (active?._id === row._id) setActive((item) => ({ ...item, status: next }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update lead');
    }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        kicker="Sales"
        title="PDI leads"
        subtitle="Inspection requests from the used-car and new-car booking pages."
      />
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100">
          <option value="">All types</option>
          <option value="USED_CAR">Used car</option>
          <option value="NEW_CAR">New car PDI</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100">
          <option value="">All statuses</option>
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <span className="text-xs font-semibold text-slate-400 self-center">{visible.length} leads</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              {['Customer', 'Car', 'Type', 'When', 'Address', 'Amount', 'Status'].map((label) => (
                <th key={label} className="px-3 py-3 font-black">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row._id} className="border-t border-slate-800 text-slate-200">
                <td className="px-3 py-3">
                  <button type="button" onClick={() => setActive(row)} className="font-bold text-white hover:text-blue-300">{row.name || '—'}</button>
                  <p className="text-[11px] text-slate-400">{row.phone} · {row.email}</p>
                </td>
                <td className="px-3 py-3">{row.brand} {row.model}</td>
                <td className="px-3 py-3">{row.pdiType === 'NEW_CAR' ? 'New car' : 'Used car'}</td>
                <td className="px-3 py-3 text-xs">{row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString('en-IN') : '—'}<br />{row.timeSlot}</td>
                <td className="px-3 py-3 min-w-[220px]">
                  <p className="text-slate-100">{row.address || '—'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{[row.city, row.pincode].filter(Boolean).join(', ') || '—'}</p>
                </td>
                <td className="px-3 py-3 font-bold">{inr(row.amount)}</td>
                <td className="px-3 py-3">
                  <StatusBadge value={row.status} />
                  <select
                    className="mt-2 block bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px]"
                    value={row.status}
                    onChange={(e) => updateStatus(row, e.target.value)}
                  >
                    {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr><td colSpan={7} className="px-3 py-8 text-slate-500">No inspection leads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="rounded-2xl border border-slate-800 p-5 text-sm text-slate-300">
          <p className="font-black text-white">{active.name} · {active.brand} {active.model}</p>
          <p className="mt-2"><span className="text-slate-500">Address</span><br />{active.address || '—'}{active.city ? `, ${active.city}` : ''}{active.pincode ? ` ${active.pincode}` : ''}</p>
          <p className="mt-1">
            {active.vehicleSegment === 'SUV_LUXURY' ? 'SUV / Luxury' : active.vehicleSegment === 'HATCH_SEDAN' ? 'Hatchback / Sedan' : active.engineBand || 'Segment not set'}
            {' · '}OBD {active.obdScan ? 'included' : 'no'}
            {' · '}Service history {active.serviceHistory ? 'included' : 'no'}
          </p>
        </div>
      )}
    </div>
  );
}
