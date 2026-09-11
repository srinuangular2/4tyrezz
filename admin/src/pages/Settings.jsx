import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { GlassCard, PageHeader, btnPrimary, inputCls } from '../components/admin/ui';

export default function Settings() {
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get('/admin/settings').then((r) => setForm(r.data.data)).catch(() => setForm({
      commissionRatePercent: 2.5,
      leadChargeFixed: 0,
      requireListingModeration: true,
      bookingTokenAmount: 5000,
      featureToggles: { homeTestDrive: true, financeDesk: true, insuranceDesk: true, compareTray: true },
    }));
  }, []);

  if (!form) return <div className="h-48 skeleton" />;

  const save = async () => {
    await api.put('/admin/settings', form);
    toast.success('Settings saved');
  };

  const toggle = (key) => setForm({ ...form, featureToggles: { ...form.featureToggles, [key]: !form.featureToggles?.[key] } });

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader kicker="Platform" title="System settings" subtitle="Feature toggles, moderation rules, and commercial defaults. API secrets stay in server env — they are not stored here." />
      <GlassCard className="p-5 space-y-4">
        <label className="block text-xs font-bold text-slate-400">
          Booking token amount (₹)
          <input className={`${inputCls} mt-1`} type="number" value={form.bookingTokenAmount} onChange={(e) => setForm({ ...form, bookingTokenAmount: Number(e.target.value) })} />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={!!form.requireListingModeration} onChange={(e) => setForm({ ...form, requireListingModeration: e.target.checked })} />
          Require listing moderation before publish
        </label>
        {['homeTestDrive', 'financeDesk', 'insuranceDesk', 'compareTray'].map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-200 capitalize">
            <input type="checkbox" checked={!!form.featureToggles?.[key]} onChange={() => toggle(key)} />
            Enable {key.replace(/([A-Z])/g, ' $1')}
          </label>
        ))}
        <p className="text-xs text-slate-500">Razorpay, MSG91, and JWT keys are read from backend `.env` and never rendered in this panel.</p>
        <button type="button" className={btnPrimary} onClick={save}>Save settings</button>
      </GlassCard>
    </div>
  );
}
