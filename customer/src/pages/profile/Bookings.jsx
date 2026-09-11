import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { StatusPill } from './hubUtils';

export default function Bookings() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/user/bookings').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  }, []);

  const receipt = async (id) => {
    try {
      const { data } = await api.get(`/user/bookings/${id}/receipt`);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(data.html || `<p>${data.invoiceRef || 'Receipt'}</p>`);
        win.document.close();
        win.print();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not open receipt');
    }
  };

  return (
    <ProfileCard eyebrow="Reservations" title="My bookings">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading bookings…</p>}
      {rows && rows.length === 0 && <EmptyNote>No token payments or reservations yet.</EmptyNote>}
      <div className="space-y-3">
        {(rows || []).map((b) => (
          <article key={b.id} className="rounded-2xl border border-slate-100 px-4 py-4 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-black text-slate-900">{b.vehicle?.title || 'Vehicle reservation'}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {b.bookingRef} · Token {formatINR(b.amount)}
                {b.refunded ? ' · Refund initiated' : ''}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">
                {b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN') : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill value={b.status} />
              <button type="button" onClick={() => receipt(b.id)} className="text-[11px] font-black text-[#3083ff]">
                Download receipt
              </button>
            </div>
          </article>
        ))}
      </div>
    </ProfileCard>
  );
}
