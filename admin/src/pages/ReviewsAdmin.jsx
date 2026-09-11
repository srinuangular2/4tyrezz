import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { FilterPills, PageHeader, StatusBadge } from '../components/admin/ui';

export default function ReviewsAdmin() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('pending');

  const load = async (page = 1) => {
    const { data } = await api.get('/admin/reviews', { params: { page, limit: 20, status: status || undefined } });
    setRows(data.data || []);
    setMeta({ page: data.page, pages: data.pages });
  };
  useEffect(() => { load(1); }, [status]);

  const setReview = async (id, next) => {
    await api.patch(`/admin/reviews/${id}`, { status: next });
    toast.success(`Review ${next}`);
    load(meta.page);
  };

  return (
    <div className="space-y-4">
      <PageHeader kicker="Trust" title="Reviews & ratings" subtitle="Approve or reject customer reviews before they appear on dealer profiles." />
      <FilterPills
        value={status}
        onChange={setStatus}
        options={[
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: '', label: 'All' },
        ]}
      />
      <DataTable
        rows={rows}
        page={meta.page}
        pages={meta.pages}
        onPageChange={load}
        columns={[
          { key: 'user', label: 'Customer', render: (r) => r.user?.name || '—' },
          { key: 'rating', label: 'Rating', render: (r) => `${r.rating}/5` },
          { key: 'comment', label: 'Comment' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
          {
            key: 'act',
            label: '',
            render: (r) => (
              <div className="flex gap-2">
                <button type="button" className="text-xs font-bold text-emerald-400" onClick={() => setReview(r._id, 'approved')}>Approve</button>
                <button type="button" className="text-xs font-bold text-rose-400" onClick={() => setReview(r._id, 'rejected')}>Reject</button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
