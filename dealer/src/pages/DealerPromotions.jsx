import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ProfileCard } from '../components/ui';

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
    <ProfileCard eyebrow="Campaigns" title="Promotions & featured cars">
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {(data.plans || []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p.id)}
            className={`rounded-2xl border p-4 text-left ${plan === p.id ? 'border-[#3083ff] bg-blue-50' : 'border-slate-100'}`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{p.label}</p>
            <p className="font-display font-black text-2xl text-slate-900 mt-1">₹{p.price}</p>
            <p className="text-xs font-semibold text-slate-500">{p.days === 1 ? 'Daily boost' : `${p.days}-day homepage placement`}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select className="border rounded-xl px-3 py-2.5 text-sm font-bold min-w-[220px]" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {(data.inventory || []).map((c) => <option key={c._id} value={c._id}>{c.title} · ₹{Number(c.price).toLocaleString('en-IN')}</option>)}
        </select>
        <button type="button" onClick={boost} className="bg-[#3083ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-2.5">Boost listing</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr className="text-left">
              {['Vehicle', 'Plan', 'Boost', 'CTR', 'Leads', 'Ends'].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {(data.campaigns || []).map((c) => (
              <tr key={c._id} className="border-t border-slate-100">
                <td className="py-3 pr-3 font-bold">{c.vehicle?.title || '—'}</td>
                <td className="py-3 pr-3">{c.label}</td>
                <td className="py-3 pr-3">{c.boost}</td>
                <td className="py-3 pr-3">{c.ctr}%</td>
                <td className="py-3 pr-3">{c.leads}</td>
                <td className="py-3">{c.endAt ? new Date(c.endAt).toLocaleDateString('en-IN') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.campaigns?.length && <p className="text-sm font-semibold text-slate-500 py-6 text-center">No active boosts yet.</p>}
      </div>
    </ProfileCard>
  );
}
