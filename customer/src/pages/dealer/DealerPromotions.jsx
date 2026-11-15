import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Car, Flame, Sparkles, Star, Zap } from 'lucide-react';
import { GlassCard, PageHeader, btnPrimary, inputCls } from '../../components/dealer/ui';

export default function DealerPromotions() {
  const [data, setData] = useState({ plans: [], campaigns: [], inventory: [] });
  const [vehicleId, setVehicleId] = useState('');
  const [plan, setPlan] = useState('featured');

  const load = () => {
    api.get('/dealer/promotions').then((r) => {
      setData(r.data);
      setVehicleId((id) => id || r.data.inventory?.[0]?._id || '');
    }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const boost = async () => {
    if (!vehicleId) return;
    try {
      await api.post('/dealer/promotions/boost', { vehicleId, plan });
      toast.success('Listing boosted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not boost');
    }
  };

  const plans = data.plans || [];
  const selectedPlan = plans.find((p) => p.id === plan) || plans[0];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="-mx-3 -mt-3 bg-[#3083ff] px-4 py-4 text-white lg:hidden">
        <p className="text-[12px] text-white/80">Homepage placement</p>
        <h1 className="text-[20px] font-semibold">Offers</h1>
      </div>
      <div className="hidden lg:block">
      <PageHeader kicker="Campaigns" title="Promotions & featured cars" subtitle="Boost inventory onto the 4tyrezz homepage." />
      </div>
      <div className="space-y-3 lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          {plans.map((p, index) => {
            const tones = ['from-[#ffe09a] to-[#fff0c8]', 'from-[#b7d9f8] to-[#dceefc]', 'from-[#d9c6f6] to-[#eee4fc]', 'from-[#b4e8d0] to-[#d8f5e8]'];
            const icons = [Flame, Star, Sparkles, Zap];
            const Icon = icons[index % icons.length];
            const on = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={`rounded-[20px] border p-3 text-left ${on ? 'border-[#3083ff] bg-gradient-to-b from-[#3083ff] to-[#1853ff] text-white' : `border-white bg-gradient-to-b ${tones[index % tones.length]} text-slate-900`}`}
              >
                <Icon className={`h-4 w-4 ${on ? 'text-white' : 'text-[#1853ff]'}`} />
                <p className={`mt-2 text-[12px] font-normal ${on ? 'text-white/80' : 'text-slate-600'}`}>{p.label}</p>
                <p className="mt-1 text-[18px] font-medium">₹{p.price}</p>
                <p className={`text-[11px] font-normal ${on ? 'text-white/75' : 'text-slate-500'}`}>{p.days === 1 ? '1 day' : `${p.days} days`}</p>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl bg-white p-3">
          <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500"><Car className="h-3.5 w-3.5 text-[#3083ff]" /> Car</label>
          <select className={`${inputCls} mt-1`} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {(data.inventory || []).map((c) => <option key={c._id} value={c._id}>{c.title} · ₹{Number(c.price).toLocaleString('en-IN')}</option>)}
          </select>
          <button type="button" onClick={boost} className={`${btnPrimary} mt-3 w-full`}>
            Boost {selectedPlan ? `· ₹${selectedPlan.price}` : 'listing'}
          </button>
        </div>
        <div>
          <h2 className="mb-2 text-[16px] font-semibold text-slate-900">Active boosts</h2>
          {(data.campaigns || []).length ? (data.campaigns || []).map((c) => (
            <div key={c._id} className="mb-2 flex items-start gap-3 rounded-[20px] border border-[#dbeafe] bg-gradient-to-r from-[#eaf2ff] to-white px-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#3083ff]"><Sparkles className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-slate-900">{c.vehicle?.title || c.label || 'Listing'}</p>
                <p className="mt-1 text-[12px] font-normal text-slate-600">{c.label} · {c.leads || 0} leads · CTR {c.ctr || 0}%</p>
                <p className="mt-0.5 text-[12px] font-normal text-slate-500">Ends {c.endAt ? new Date(c.endAt).toLocaleDateString('en-IN') : '—'}</p>
              </div>
            </div>
          )) : (
            <p className="rounded-2xl bg-white px-3 py-6 text-center text-[13px] text-slate-500">No active boosts yet.</p>
          )}
        </div>
      </div>
      <GlassCard className="hidden p-5 lg:block">
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {(data.plans || []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p.id)}
            className={`rounded-2xl border p-4 text-left ${plan === p.id ? 'border-[#3083ff] bg-blue-50' : 'border-slate-100 bg-white'}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{p.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">₹{p.price}</p>
            <p className="text-xs font-semibold text-slate-500">{p.days === 1 ? 'Daily boost' : `${p.days}-day homepage placement`}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select className={`${inputCls} min-w-[220px]`} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {(data.inventory || []).map((c) => <option key={c._id} value={c._id}>{c.title} · ₹{Number(c.price).toLocaleString('en-IN')}</option>)}
        </select>
        <button type="button" onClick={boost} className={btnPrimary}>Boost listing</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            <tr className="text-left">
              {['Vehicle', 'Plan', 'Boost', 'CTR', 'Leads', 'Ends'].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {(data.campaigns || []).map((c) => (
              <tr key={c._id} className="border-t border-slate-100">
                <td className="py-3 pr-3 font-bold text-slate-900">{c.vehicle?.title || '—'}</td>
                <td className="py-3 pr-3 text-slate-600">{c.label}</td>
                <td className="py-3 pr-3 text-slate-600">{c.boost}</td>
                <td className="py-3 pr-3 text-slate-600">{c.ctr}%</td>
                <td className="py-3 pr-3 text-slate-600">{c.leads}</td>
                <td className="py-3 text-slate-600">{c.endAt ? new Date(c.endAt).toLocaleDateString('en-IN') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.campaigns?.length && <p className="text-sm font-semibold text-slate-500 py-6 text-center">No active boosts yet.</p>}
      </div>
      </GlassCard>
    </div>
  );
}
