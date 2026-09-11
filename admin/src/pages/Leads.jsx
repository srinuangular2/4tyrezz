import OpsTable from '../components/admin/OpsTable';

const LEAD_STAGES = [
  'New Lead',
  'Contacted',
  'Follow-Up Scheduled',
  'Test Drive Booked',
  'Negotiation',
  'Token Booked',
  'Sold',
  'Lost',
];

export default function Leads() {
  return (
    <OpsTable
      kicker="Pipeline"
      title="Leads"
      subtitle="Buyer and seller enquiries across call, WhatsApp, finance, and listing forms. Change stage inline to move the pipeline."
      endpoint="/admin/leads"
      filterKey="enquiryType"
      filters={[
        { value: '', label: 'All' },
        { value: 'enquiry', label: 'Enquiry' },
        { value: 'call', label: 'Call' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'finance', label: 'Finance' },
        { value: 'insurance', label: 'Insurance' },
      ]}
      columns={[
        { key: 'name', label: 'Buyer' },
        { key: 'phone', label: 'Phone' },
        { key: 'car', label: 'Vehicle', render: (r) => r.car?.title || '—' },
        { key: 'seller', label: 'Seller', render: (r) => r.seller?.dealershipName || r.seller?.name || '—' },
        { key: 'enquiryType', label: 'Type', render: (r) => r.enquiryType },
      ]}
      statusPatch={{
        field: 'stage',
        label: 'Update stage',
        options: LEAD_STAGES,
        path: (row) => `/admin/leads/${row._id}/stage`,
        bodyKey: 'stage',
      }}
    />
  );
}
