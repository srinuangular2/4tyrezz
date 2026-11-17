import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CarFront, MapPin } from 'lucide-react';
import api from '../../api/axios';
import PdiHealthReport from '../../components/pdi/PdiHealthReport';
import { EmptyNote } from './ProfileLayout';
import { formatDateLabel, mediaUrl } from './hubUtils';

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
      <div className="flex justify-end">
        <Link to="/pre-delivery-inspection" className="text-[13px] font-semibold text-[#3083ff]">Book another</Link>
      </div>
      {loading && <p className="text-sm text-slate-500">Loading your inspections…</p>}
      {!loading && !rows.length && <EmptyNote>No inspections booked yet. Book a visit and the car, slot and report will show here.</EmptyNote>}
      {rows.map((row) => {
        const current = stepIndex(row.status);
        const cancelled = row.status === 'CANCELLED';
        const booking = openId === row._id ? detail?.data || row : row;
        const address = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');
        const segment = booking.vehicleSegment === 'SUV_LUXURY' ? 'SUV / Luxury' : booking.vehicleSegment === 'HATCH_SEDAN' ? 'Hatchback / Sedan' : '';
        const photo = row.image ? mediaUrl(row.image) : '';
        const logo = row.brandLogo ? mediaUrl(row.brandLogo) : '';
        const title = `${row.brand || ''} ${row.model || ''}`.trim() || 'Inspection';
        return (
          <article key={row._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col sm:flex-row">
              <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden bg-[#f3f7fc] sm:w-52">
                {photo ? (
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : logo ? (
                  <img src={logo} alt="" className="h-20 w-20 object-contain" />
                ) : (
                  <CarFront className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#3083ff]">{row.pdiType === 'NEW_CAR' ? 'New car PDI' : 'Used car inspection'}{segment ? ` · ${segment}` : ''}</p>
                    <h3 className="mt-1 text-[18px] font-semibold leading-snug text-slate-900">{title}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${cancelled ? 'bg-rose-50 text-rose-600' : row.status === 'PAYMENT_PENDING' ? 'bg-amber-50 text-amber-700' : row.status === 'IN_PROGRESS' ? 'bg-[#e8f1ff] text-[#1853ff]' : 'bg-[#e8f8ef] text-[#0e7a52]'}`}>
                    {STATUS_COPY[row.status] || row.status}
                  </span>
                </div>
                <p className="mt-2 text-[16px] font-semibold text-[#1853ff]">{inr(row.amount)}{row.razorpayPaymentId ? ' · Paid' : row.status === 'PAYMENT_PENDING' ? ' · Payment pending' : ''}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{when(row)}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{row.city || 'City not set'}</span>
                </div>
              </div>
            </div>
            {cancelled ? (
              <p className="px-5 pb-4 text-[13px] font-medium text-rose-500">This inspection was cancelled.</p>
            ) : (
              <ol className="grid grid-cols-4 gap-2 px-4 pb-1 sm:px-5">
                {STEPS.map((step, stepAt) => (
                  <li key={step.key}>
                    <span className={`block h-1.5 rounded-full ${stepAt <= current ? 'bg-[#3083ff]' : 'bg-slate-200'}`} />
                    <span className={`mt-1.5 block text-[12px] font-medium ${stepAt === current ? 'text-[#1853ff]' : stepAt < current ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                  </li>
                ))}
              </ol>
            )}
            <button type="button" onClick={() => open(row._id)} className="mx-4 mb-4 mt-3 h-10 rounded-xl border border-slate-200 px-4 text-[13px] font-semibold text-[#1853ff] hover:bg-[#f4f7fb] sm:mx-5">
              {openId === row._id ? 'Hide details' : 'Booking details'}
            </button>
            {openId === row._id && (
              <dl className="mx-4 mb-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#f4f7fb] p-4 sm:mx-5">
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
              <div className="mx-4 mb-4 sm:mx-5">
                <PdiHealthReport booking={detail.data} report={detail.report} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
