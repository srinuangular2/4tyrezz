import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { formatWhen, StatusPill, VehicleCard } from './hubUtils';

const TYPE_LABEL = {
  purchase: 'Car purchase',
  token_payment: 'Token payment',
};

export default function Orders() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/user/orders')
      .then((r) => setRows(r.data.data || []))
      .catch((e) => {
        setRows([]);
        setError(e.response?.data?.message || 'Could not load orders');
      });
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
    <ProfileCard eyebrow="Account" title="My orders">
      {error && <p className="text-sm font-semibold text-rose-600 mb-3">{error}</p>}
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading orders…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          No car purchases or token payments yet.{' '}
          <Link to="/cars" className="text-[#3083ff] font-black">Browse cars</Link>
        </EmptyNote>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((o) => (
            <VehicleCard
              key={`${o.source}-${o.id}`}
              image={o.image}
              title={o.title}
              price={o.price != null ? formatINR(o.price) : o.amount ? formatINR(o.amount) : ''}
              facts={[TYPE_LABEL[o.type] || o.type, o.year, o.fuel, o.refId ? `#${o.refId}` : ''].filter(Boolean).join(' · ')}
              when={formatWhen(o.createdAt, true)}
              status={<StatusPill value={o.status} />}
            >
              {o.carId ? <Link to={`/cars/${o.carId}`} className="text-[12px] font-semibold text-[#3083ff]">View car</Link> : null}
              {o.source === 'booking' ? (
                <button type="button" onClick={() => receipt(o.id)} className="text-[12px] font-semibold text-[#3083ff]">
                  Download receipt
                </button>
              ) : null}
            </VehicleCard>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
