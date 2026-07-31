import { useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from './DataTable';
import { formatPrice } from '../utils/format';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-verify-bg text-verify',
  rejected: 'bg-red-100 text-red-700', sold: 'bg-slate-200 text-slate-600',
};

export default function CarsManager({ defaultStatus = '' }) {
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState(defaultStatus);
  const [search, setSearch] = useState('');

  const load = async (page = 1) => {
    const { data } = await api.get('/cars', { params: { status: status || undefined, search: search || undefined, page, limit: 8, sort: '-createdAt' } });
    setCars(data.cars);
    setMeta({ page: data.page, pages: data.pages });
  };

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, [status]);

  const setCarStatus = async (id, newStatus) => { await api.patch(`/admin/cars/${id}/status`, { status: newStatus }); load(meta.page); };
  const toggleFlag = async (id, field) => { await api.patch(`/admin/cars/${id}/flag`, { field }); load(meta.page); };
  const remove = async (id) => { if (!confirm('Delete this listing?')) return; await api.delete(`/cars/${id}`); load(meta.page); };

  const columns = [
    { key: 'title', label: 'Car', render: (c) => <span className="font-medium">{c.title}</span> },
    { key: 'price', label: 'Price', render: (c) => formatPrice(c.price) },
    { key: 'seller', label: 'Seller', render: (c) => c.owner?.dealershipName || c.owner?.name || c.owner?.mobile || '—' },
    { key: 'status', label: 'Status', render: (c) => <span className={`text-xs font-bold px-2 py-1 rounded-md capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span> },
    { key: 'flags', label: 'Flags', render: (c) => (
      <div className="flex gap-1.5">
        <button onClick={() => toggleFlag(c._id, 'isFeatured')} className={`text-[11px] font-bold px-2 py-1 rounded-md ${c.isFeatured ? 'bg-ink text-white' : 'bg-slate-100 text-slate2'}`}>Featured</button>
        <button onClick={() => toggleFlag(c._id, 'isPremium')} className={`text-[11px] font-bold px-2 py-1 rounded-md ${c.isPremium ? 'bg-ember text-white' : 'bg-slate-100 text-slate2'}`}>Premium</button>
      </div>
    ) },
    { key: 'actions', label: 'Actions', render: (c) => (
      <div className="flex gap-2 flex-wrap">
        {c.status !== 'approved' && <button onClick={() => setCarStatus(c._id, 'approved')} className="text-verify text-xs font-bold">Approve</button>}
        {c.status !== 'rejected' && <button onClick={() => setCarStatus(c._id, 'rejected')} className="text-red-600 text-xs font-bold">Reject</button>}
        {c.status !== 'sold' && <button onClick={() => setCarStatus(c._id, 'sold')} className="text-slate2 text-xs font-bold">Mark sold</button>}
        <button onClick={() => remove(c._id)} className="text-red-600 text-xs font-bold">Delete</button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search by title…" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-56"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="sold">Sold</option>
        </select>
      </div>
      <DataTable columns={columns} rows={cars} page={meta.page} pages={meta.pages} onPageChange={load} />
    </div>
  );
}
