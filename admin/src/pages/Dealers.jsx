import { useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function Dealers() {
  const [dealers, setDealers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', dealershipName: '', city: '' });
  const [error, setError] = useState('');

  const load = async (page = 1) => {
    const { data } = await api.get('/admin/users', { params: { role: 'dealer', page, limit: 10 } });
    setDealers(data.dealers || data.users); setMeta({ page: data.page, pages: data.pages });
  };
  useEffect(() => { load(1); }, []);

  const toggleActive = async (id) => { await api.patch(`/admin/users/${id}/toggle-active`); load(meta.page); };

  const addDealer = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register-dealer', form);
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', dealershipName: '', city: '' });
      load(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create dealer');
    }
  };

  const columns = [
    { key: 'dealershipName', label: 'Dealership', render: (d) => d.dealershipName || d.name || '—' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City', render: (d) => d.city || '—' },
    { key: 'status', label: 'Status', render: (d) => (
      <span className={`text-xs font-bold px-2 py-1 rounded-md ${d.isActive ? 'bg-verify-bg text-verify' : 'bg-slate-200 text-slate-600'}`}>
        {d.isActive ? 'Active' : 'Disabled'}
      </span>
    ) },
    { key: 'actions', label: 'Actions', render: (d) => (
      <button onClick={() => toggleActive(d._id)} className="text-xs font-bold text-ember">{d.isActive ? 'Disable' : 'Enable'}</button>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display font-black text-2xl">Dealer Management</h1>
        <button onClick={() => setShowAdd(true)} className="bg-ember hover:bg-ember-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Dealer</button>
      </div>
      <DataTable columns={columns} rows={dealers} page={meta.page} pages={meta.pages} onPageChange={load} />

      {showAdd && (
        <Modal title="Add Dealer" onClose={() => setShowAdd(false)}>
          <form onSubmit={addDealer} className="space-y-3">
            <input required placeholder="Contact name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Dealership name" value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-2.5 rounded-lg">Create dealer account</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
