import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ProfileCard } from '../components/ui';

const STATUSES = ['Token Received', 'Financing Pending', 'Fully Paid', 'Cancelled/Refunded'];

function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function DealerBookings() {
  const [rows, setRows] = useState([]);

  const load = () => {
    api.get('/dealer/bookings').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  };
  useEffect(() => { load(); }, []);

  const invoice = async (row) => {
    try {
      const { data } = await api.post(`/dealer/bookings/${row.id}/invoice`);
      const w = window.open('', '_blank');
      w.document.write(data.html);
      w.document.close();
      w.focus();
      w.print();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not generate invoice');
    }
  };

  const patch = async (row, status) => {
    try {
      await api.patch(`/dealer/bookings/${row.id}`, { status });
      toast.success('Booking updated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update');
    }
  };

  return (
    <ProfileCard eyebrow="Ledger" title="Booking & token payments">
      {rows.length === 0 && <p className="text-sm font-semibold text-slate-500 py-8 text-center">No token bookings yet.</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr className="text-left">
                {['Customer', 'Car', 'Token', 'Payment ID', 'Booked', 'Delivery', 'Status', 'Actions'].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-3 pr-3 font-bold">{r.customerName || '—'}<br /><span className="text-xs text-slate-400">{r.bookingRef}</span></td>
                  <td className="py-3 pr-3">{r.carTitle || '—'}</td>
                  <td className="py-3 pr-3 font-black">{formatINR(r.tokenAmount)}</td>
                  <td className="py-3 pr-3 text-xs">{r.paymentId || '—'}</td>
                  <td className="py-3 pr-3">{r.bookingDate ? new Date(r.bookingDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-3 pr-3">{r.deliveryDeadline ? new Date(r.deliveryDeadline).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-3 pr-3">
                    <select className="border rounded-lg px-2 py-1 text-xs font-bold" value={r.status} onChange={(e) => patch(r, e.target.value)}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => invoice(r)} className="text-[11px] font-black text-[#3083ff]">Invoice PDF</button>
                      <button type="button" onClick={() => patch(r, 'Fully Paid')} className="text-[11px] font-black text-emerald-700">Mark delivered</button>
                      <button type="button" onClick={() => patch(r, 'Cancelled/Refunded')} className="text-[11px] font-black text-rose-600">Refund request</button>
                    </div>
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
