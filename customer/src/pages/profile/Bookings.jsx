import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { formatWhen, StatusPill, VehicleCard } from './hubUtils';

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
          <VehicleCard
            key={b.id}
            image={b.vehicle?.images?.[0]}
            title={b.vehicle?.title || 'Vehicle reservation'}
            price={b.vehicle?.price != null ? formatINR(b.vehicle.price) : ''}
            facts={[b.vehicle?.year, b.bookingRef, b.amount != null ? `Token ${formatINR(b.amount)}` : '', b.refunded ? 'Refund initiated' : ''].filter(Boolean).join(' · ')}
            when={formatWhen(b.createdAt)}
            status={<StatusPill value={b.status} />}
          >
            {b.vehicle?._id ? <Link to={`/cars/${b.vehicle._id}`} className="text-[12px] font-semibold text-[#3083ff]">View car</Link> : null}
            <button type="button" onClick={() => receipt(b.id)} className="text-[12px] font-semibold text-[#3083ff]">
              Download receipt
            </button>
          </VehicleCard>
        ))}
      </div>
    </ProfileCard>
  );
}
