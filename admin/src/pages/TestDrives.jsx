import OpsTable from '../components/admin/OpsTable';

const TEST_DRIVE_STATUSES = [
  'Requested',
  'Confirmed',
  'Scheduled',
  'Rescheduled',
  'In Progress',
  'Completed',
  'Feedback Recorded',
  'No-Show',
  'Cancelled',
];

export default function TestDrives() {
  return (
    <OpsTable
      kicker="Scheduling"
      title="Test drives"
      subtitle="Dealership slots and home test-drive requests. Update status as the appointment progresses."
      endpoint="/admin/test-drives"
      filters={[
        { value: '', label: 'All' },
        { value: 'Requested', label: 'Requested' },
        { value: 'Confirmed', label: 'Confirmed' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' },
      ]}
      columns={[
        { key: 'customer', label: 'Customer', render: (r) => r.customerName || r.user?.name },
        { key: 'phone', label: 'Phone', render: (r) => r.customerPhone },
        { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.title || '—' },
        { key: 'when', label: 'Slot', render: (r) => `${r.preferredDate ? new Date(r.preferredDate).toLocaleDateString() : '—'} ${r.preferredTime || ''}` },
        { key: 'mode', label: 'Mode', render: (r) => (r.homeTestDrive ? 'Home' : 'Dealership') },
      ]}
      statusPatch={{
        field: 'status',
        label: 'Update status',
        options: TEST_DRIVE_STATUSES,
        path: (row) => `/test-drives/${row._id}`,
        bodyKey: 'status',
      }}
    />
  );
}
