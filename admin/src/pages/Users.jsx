import { useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');

  const load = async (page = 1) => {
    const { data } = await api.get('/admin/users', { params: { role: 'customer', search: search || undefined, page, limit: 10 } });
    setUsers(data.users); setMeta({ page: data.page, pages: data.pages });
  };
  useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

  const toggleActive = async (id) => { await api.patch(`/admin/users/${id}/toggle-active`); load(meta.page); };

  const columns = [
    { key: 'name', label: 'Name', render: (u) => u.name || '—' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'joined', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (u) => (
      <span className={`text-xs font-bold px-2 py-1 rounded-md ${u.isActive ? 'bg-verify-bg text-verify' : 'bg-slate-200 text-slate-600'}`}>
        {u.isActive ? 'Active' : 'Disabled'}
      </span>
    ) },
    { key: 'actions', label: 'Actions', render: (u) => (
      <button onClick={() => toggleActive(u._id)} className="text-xs font-bold text-ember">
        {u.isActive ? 'Disable' : 'Enable'}
      </button>
    ) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display font-black text-2xl">User Management</h1>
      <input
        value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(1)}
        placeholder="Search by name or mobile…" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-64"
      />
      <DataTable columns={columns} rows={users} page={meta.page} pages={meta.pages} onPageChange={load} />
    </div>
  );
}
