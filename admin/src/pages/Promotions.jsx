import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Banners from './Banners';
import { FilterPills, GlassCard, PageHeader, StatusBadge, btnPrimary, inputCls } from '../components/admin/ui';

export default function Promotions() {
  const [tab, setTab] = useState('banners');
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: '', subtitle: '', ctaLabel: 'View', url: '' });

  const load = () => api.get('/promotions').then((r) => setRows(r.data.data || r.data || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.post('/promotions', {
      title: form.title,
      description: form.subtitle,
      type: 'campaign',
      meta: { url: form.url, ctaLabel: form.ctaLabel },
    });
    toast.success('Campaign saved');
    setForm({ title: '', subtitle: '', ctaLabel: 'View', url: '' });
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader kicker="Growth" title="Promotions & featured listings" subtitle="Home banners and dealer campaign slots." />
      <FilterPills
        value={tab}
        onChange={setTab}
        options={[
          { value: 'banners', label: 'Ad banners' },
          { value: 'campaigns', label: 'Campaigns' },
        ]}
      />
      {tab === 'banners' && <Banners />}
      {tab === 'campaigns' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <GlassCard className="p-5">
            <form onSubmit={save} className="space-y-3">
              <input className={inputCls} placeholder="Campaign title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input className={inputCls} placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              <input className={inputCls} placeholder="CTA URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              <button className={btnPrimary}>Create campaign</button>
            </form>
          </GlassCard>
          <div className="space-y-2">
            {(Array.isArray(rows) ? rows : []).map((r) => (
              <GlassCard key={r._id} className="p-4 flex justify-between">
                <div>
                  <p className="font-bold text-white">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.description || r.subtitle}</p>
                </div>
                <StatusBadge value={r.isActive === false ? 'Paused' : 'Active'} />
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
