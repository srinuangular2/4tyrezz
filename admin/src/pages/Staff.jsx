import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { PageHeader } from '../components/admin/ui';

export default function Staff() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'field_agent', assignedRegion: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/staff', form);
      toast.success('Child admin created');
      setForm({ name: '', email: '', password: '', role: 'field_agent', assignedRegion: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create the account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <PageHeader
        kicker="Access"
        title="Child admins"
        subtitle="Field agents upload cars for your approval. Executive agents only see the cars they upload."
      />
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-800 p-5">
        <input required placeholder="Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" minLength={8} placeholder="Password (8+ characters)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="field_agent">Field agent — upload only, stays pending</option>
          <option value="executive_agent">Executive agent — own uploads, approvals, and sold cars</option>
        </select>
        {form.role === 'executive_agent' && (
          <input placeholder="Assigned city, for example Hyderabad" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" value={form.assignedRegion} onChange={(e) => setForm({ ...form, assignedRegion: e.target.value })} />
        )}
        <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 text-white font-semibold px-4 py-2.5 text-sm disabled:opacity-50">
          {saving ? 'Creating…' : 'Create child admin'}
        </button>
      </form>
    </div>
  );
}
