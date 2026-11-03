import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import PdiHealthReport from '../../components/pdi/PdiHealthReport';

const STEPS = [
  { key: 'PAYMENT_PENDING', label: 'Payment' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'IN_PROGRESS', label: 'On site' },
  { key: 'COMPLETED', label: 'Report' },
];

const STATUS_COPY = {
  PAYMENT_PENDING: 'Waiting for payment',
  REQUESTED: 'Request received',
  CONFIRMED: 'Slot confirmed',
  IN_PROGRESS: 'Inspector is on the way',
  COMPLETED: 'Report is ready',
  CANCELLED: 'Cancelled',
};

function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function stepIndex(status) {
  if (status === 'REQUESTED') return 1;
  const index = STEPS.findIndex((step) => step.key === status);
  return index < 0 ? 0 : index;
}

function when(row) {
  const date = row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set';
  return `${date} · ${row.timeSlot || 'Slot not set'}`;
}

export default function PdiBookings() {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pdi/bookings')
      .then((res) => setRows(res.data.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const open = async (id) => {
    if (openId === id) {
      setOpenId('');
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    try {
      const { data } = await api.get(`/pdi/bookings/${id}`);
      setDetail(data);
    } catch {
      setDetail(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Car inspection</h1>
          <p className="text-sm text-slate-500 mt-1">Track payment, the visit, and your report.</p>
        </div>
        <Link to="/inspection" className="text-xs font-black text-[#3083ff]">Book another</Link>
      </div>
      {loading && <p className="text-sm text-slate-500">Loading your inspections…</p>}
      {!loading && !rows.length && <p className="text-sm text-slate-500">No inspections booked yet.</p>}
      {rows.map((row) => {
        const current = stepIndex(row.status);
        const cancelled = row.status === 'CANCELLED';
        const booking = openId === row._id ? detail?.data || row : row;
        return (
          <article key={row._id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-900 text-sm">{row.brand} {row.model}</p>
                <p className="text-xs text-slate-500 mt-1">{row.pdiType === 'NEW_CAR' ? 'New car PDI' : 'Used car inspection'} · {when(row)}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-black uppercase ${cancelled ? 'text-rose-600' : 'text-[#3083ff]'}`}>
                {STATUS_COPY[row.status] || row.status}
              </span>
            </div>

            {cancelled ? (
              <p className="mt-3 text-xs font-semibold text-rose-600">This inspection was cancelled.</p>
            ) : (
              <ol className="mt-4 grid grid-cols-4 gap-1">
                {STEPS.map((step, index) => (
                  <li key={step.key} className="text-center">
                    <span className={`mx-auto block h-1.5 rounded-full ${index <= current ? 'bg-[#3083ff]' : 'bg-slate-200'}`} />
                    <span className={`mt-1 block text-[10px] font-bold ${index <= current ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                  </li>
                ))}
              </ol>
            )}

            <button type="button" onClick={() => open(row._id)} className="mt-3 text-xs font-black text-[#3083ff]">
              {openId === row._id ? 'Hide details' : 'Track details'}
            </button>

            {openId === row._id && (
              <dl className="mt-3 grid sm:grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Address</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{booking.address || '—'}{booking.city ? `, ${booking.city}` : ''}{booking.pincode ? ` ${booking.pincode}` : ''}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Slot</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{when(booking)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Amount</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{inr(booking.amount)}{booking.razorpayPaymentId ? ' · Paid' : booking.status === 'PAYMENT_PENDING' ? ' · Payment pending' : ''}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Car</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {booking.brand} {booking.model}
                    {booking.vehicleSegment === 'SUV_LUXURY' ? ' · SUV / Luxury' : booking.vehicleSegment === 'HATCH_SEDAN' ? ' · Hatchback / Sedan' : ''}
                  </dd>
                </div>
              </dl>
            )}

            {openId === row._id && detail?.report && (
              <div className="mt-3">
                <PdiHealthReport booking={detail.data} report={detail.report} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
