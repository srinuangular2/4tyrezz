import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { FilterPills, PageHeader, StatusBadge, btnGhost, inr } from '../components/admin/ui';

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('');

  const load = async (page = 1) => {
    const { data } = await api.get('/admin/payments', { params: { page, limit: 20, status: status || undefined } });
    setRows(data.data || []);
    setMeta({ page: data.page, pages: data.pages });
  };
  useEffect(() => { load(1); }, [status]);

  const refund = async (id) => {
    await api.patch(`/admin/payments/${id}/refund`, { notes: 'Admin refund' });
    toast.success('Marked refunded');
    load(meta.page);
  };

  return (
    <div className="space-y-4">
      <PageHeader kicker="Ledger" title="Payments" subtitle="Gateway logs, token holds, and refunds." />
      <FilterPills
        value={status}
        onChange={setStatus}
        options={[
          { value: '', label: 'All' },
          { value: 'pending', label: 'Pending / hold' },
          { value: 'paid', label: 'Paid' },
          { value: 'failed', label: 'Failed' },
          { value: 'refunded', label: 'Refunded' },
        ]}
      />
      <DataTable
        page={meta.page}
        pages={meta.pages}
        onPageChange={load}
        rows={rows}
        columns={[
          { key: 'invoice', label: 'Invoice', render: (r) => r.invoiceRef || r.providerOrderId || '—' },
          { key: 'user', label: 'Payer', render: (r) => r.user?.name || '—' },
          { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.title || '—' },
          { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
          { key: 'method', label: 'Method', render: (r) => r.method || r.provider },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          {
            key: 'act',
            label: '',
            render: (r) => r.status === 'paid' ? (
              <button type="button" className={btnGhost} onClick={() => refund(r._id)}>Refund</button>
            ) : null,
          },
        ]}
      />
    </div>
  );
}
