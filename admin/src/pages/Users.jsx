import { useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { PageHeader, StatusBadge, inputCls } from '../components/admin/ui';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');

  const load = async (page = 1) => {
    const { data } = await api.get('/admin/users', { params: { role: 'customer', search: search || undefined, page, limit: 12 } });
    setUsers(data.users || []);
    setMeta({ page: data.page, pages: data.pages });
  };
  useEffect(() => { load(1); }, []);

  const toggleActive = async (id) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    load(meta.page);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (u) => u.name || '—' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email', render: (u) => u.email || '—' },
    { key: 'joined', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (u) => <StatusBadge value={u.isActive ? 'Active' : 'Disabled'} /> },
    {
      key: 'actions',
      label: '',
      render: (u) => (
        <button type="button" onClick={() => toggleActive(u._id)} className="text-xs font-bold text-blue-400">
          {u.isActive ? 'Disable' : 'Enable'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader kicker="Accounts" title="Customers" subtitle="Buyer accounts, activity timestamps, and access control." />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && load(1)}
        placeholder="Search by name, email, or mobile"
        className={`${inputCls} max-w-sm`}
      />
      <DataTable columns={columns} rows={users} page={meta.page} pages={meta.pages} onPageChange={load} />
    </div>
  );
}
