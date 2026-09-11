import OpsTable from '../components/admin/OpsTable';
import { inr } from '../components/admin/ui';

const BOOKING_STATUSES = [
  'Requested',
  'Confirmed',
  'Payment Pending',
  'Booked',
  'Token Received',
  'Financing Pending',
  'Fully Paid',
  'Completed',
  'Cancelled',
  'Cancelled/Refunded',
  'Refunded',
];

export default function BookingsAdmin() {
  return (
    <OpsTable
      kicker="Reservations"
      title="Bookings & tokens"
      subtitle="Token receipts, payment state, and delivery tracking. Update status or use quick actions."
      endpoint="/admin/bookings"
      filters={[
        { value: '', label: 'All' },
        { value: 'Payment Pending', label: 'Payment pending' },
        { value: 'Booked', label: 'Booked' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled/Refunded', label: 'Refunded' },
      ]}
      columns={[
        { key: 'bookingRef', label: 'Ref' },
        { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.title || '—' },
        { key: 'user', label: 'Buyer', render: (r) => r.user?.name || r.customerName || '—' },
        { key: 'amount', label: 'Token', render: (r) => inr(r.amount) },
        { key: 'deadline', label: 'Delivery', render: (r) => (r.deliveryDeadline ? new Date(r.deliveryDeadline).toLocaleDateString() : '—') },
      ]}
      statusPatch={{
        field: 'status',
        label: 'Update status',
        options: BOOKING_STATUSES,
        path: (row) => `/bookings/${row._id}`,
        bodyKey: 'status',
      }}
      quickActions={(row, patch, busy) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || row.status === 'Completed'}
            onClick={() => patch('Completed')}
            className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
          >
            Mark completed
          </button>
          <button
            type="button"
            disabled={busy || /cancel|refund/i.test(row.status || '')}
            onClick={() => patch('Cancelled/Refunded')}
            className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 disabled:opacity-40"
          >
            Cancel / refund
          </button>
        </div>
      )}
    />
  );
}
