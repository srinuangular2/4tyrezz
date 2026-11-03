import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import PdiHealthReport from '../../components/pdi/PdiHealthReport';
import { EmptyNote } from './ProfileLayout';
import { formatDateLabel, mediaUrl, StatusPill } from './hubUtils';

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
  const date = row.scheduledDate ? formatDateLabel(row.scheduledDate, true) : 'Date not set';
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
        <div className="hidden lg:block">
          <h1 className="text-xl font-black text-slate-900">Car inspection</h1>
          <p className="text-sm text-slate-500 mt-1">Track payment, the visit, and your report.</p>
        </div>
        <Link to="/inspection" className="ml-auto text-[12px] font-semibold text-[#3083ff]">Book another</Link>
      </div>
      {loading && <p className="text-sm text-slate-500">Loading your inspections…</p>}
      {!loading && !rows.length && <EmptyNote>No inspections booked yet. Book a visit and the car, slot and report will show here.</EmptyNote>}
      {rows.map((row) => {
        const current = stepIndex(row.status);
        const cancelled = row.status === 'CANCELLED';
        const booking = openId === row._id ? detail?.data || row : row;
        const address = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');
        const segment = booking.vehicleSegment === 'SUV_LUXURY' ? 'SUV / Luxury' : booking.vehicleSegment === 'HATCH_SEDAN' ? 'Hatchback / Sedan' : '';
        return (
          <article key={row._id} className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="absolute top-0 right-0 z-10">
              <StatusPill value={STATUS_COPY[row.status] || row.status} />
            </div>
            <div className="flex gap-3 p-3">
              <div className="h-[78px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {row.image ? <img src={mediaUrl(row.image)} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1 pr-16">
                <p className="text-[13px] font-semibold leading-snug text-slate-900">{`${row.brand || ''} ${row.model || ''}`.trim() || 'Inspection'}</p>
                <p className="mt-0.5 text-[12px] font-normal text-slate-500">{row.pdiType === 'NEW_CAR' ? 'New car PDI' : 'Used car inspection'}{segment ? ` · ${segment}` : ''}</p>
                <p className="mt-0.5 text-[13px] font-bold text-[#1853ff]">{inr(row.amount)}{row.razorpayPaymentId ? ' · Paid' : ''}</p>
                <p className="mt-1 text-[11px] font-normal text-slate-400">{when(row)}</p>
              </div>
            </div>
            {cancelled ? (
              <p className="px-3.5 pb-3 text-[12px] font-medium text-rose-500">This inspection was cancelled.</p>
            ) : (
              <ol className="grid grid-cols-4 gap-1 px-3.5">
                {STEPS.map((step, stepAt) => (
                  <li key={step.key} className="text-center">
                    <span className={`mx-auto block h-1.5 rounded-full ${stepAt <= current ? 'bg-[#3083ff]' : 'bg-slate-200'}`} />
                    <span className={`mt-1 block text-[11px] font-medium ${stepAt === current ? 'text-[#1853ff]' : stepAt < current ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                  </li>
                ))}
              </ol>
            )}
            <button type="button" onClick={() => open(row._id)} className="mx-3.5 mb-3 mt-3 text-[12px] font-semibold text-[#3083ff]">
              {openId === row._id ? 'Hide details' : 'Booking details'}
            </button>
            {openId === row._id && (
              <dl className="mx-3.5 mb-3 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="col-span-2">
                  <dt className="text-[11px] font-medium text-slate-400">Address</dt>
                  <dd className="mt-0.5 text-[13px] font-medium text-slate-800">{address || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-slate-400">Slot</dt>
                  <dd className="mt-0.5 text-[13px] font-medium text-slate-800">{when(booking)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-slate-400">Amount</dt>
                  <dd className="mt-0.5 text-[13px] font-bold text-[#1853ff]">{inr(booking.amount)}{booking.razorpayPaymentId ? ' · Paid' : booking.status === 'PAYMENT_PENDING' ? ' · Payment pending' : ''}</dd>
                </div>
              </dl>
            )}
            {openId === row._id && detail?.report && (
              <div className="mx-3.5 mb-3">
                <PdiHealthReport booking={detail.data} report={detail.report} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
