import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { GlassCard, PageHeader, btnPrimary, inputCls } from '../components/admin/ui';

export default function ExecutiveProfile() {
  const user = useSelector((state) => state.auth.user);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/change-password', form);
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <PageHeader
        kicker="Account"
        title="My profile"
        subtitle="Your executive workspace stays limited to the cars you upload."
      />
      <GlassCard className="p-5 space-y-3">
        <Row label="Name" value={user?.name} />
        <Row label="Email" value={user?.email} />
        <Row label="Role" value={user?.role === 'executive_agent' ? 'Executive agent' : (user?.role || '—')} />
        <Row label="Assigned city" value={user?.assignedRegion || 'Not set'} />
      </GlassCard>
      <GlassCard className="p-5">
        <h2 className="text-sm font-bold text-white mb-3">Change password</h2>
        <form onSubmit={save} className="space-y-3">
          <input
            required
            type="password"
            placeholder="Current password"
            className={inputCls}
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="New password (8+ characters)"
            className={inputCls}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-white text-right">{value || '—'}</span>
    </div>
  );
}
