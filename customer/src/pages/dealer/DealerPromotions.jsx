import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
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

  return (
    <div className="space-y-6">
      <PageHeader kicker="Campaigns" title="Promotions & featured cars" subtitle="Boost inventory onto the 4tyrezz homepage." />
      <GlassCard className="p-5">
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {(data.plans || []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p.id)}
            className={`rounded-2xl border p-4 text-left ${plan === p.id ? 'border-[#3083ff] bg-blue-50' : 'border-slate-100 bg-white'}`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{p.label}</p>
            <p className="font-display font-black text-2xl text-slate-900 mt-1">₹{p.price}</p>
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
