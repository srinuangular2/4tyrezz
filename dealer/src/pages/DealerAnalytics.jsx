import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ProfileCard } from '../components/ui';

const LABELS = [
  ['totalInventory', 'Total inventory'],
  ['pendingListings', 'Pending approval'],
  ['activeListings', 'Live on 4tyrezz'],
  ['soldCars', 'Sold'],
];

export default function DealerAnalytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dealer/dashboard/kpis').then((r) => setStats(r.data.data)).catch(() => setStats({}));
  }, []);

  const format = (key, value) => {
    if (value == null || value === '') return '—';
    if (key === 'totalRevenue') return `₹${Number(value).toLocaleString('en-IN')}`;
    if (key === 'conversionRate') return `${value}%`;
    return value;
  };

  return (
    <ProfileCard
      eyebrow="Overview"
      title="Analytics command center"
      action={<Link to="/dealer/dashboard/analytics" className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Full reports</Link>}
    >
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {LABELS.map(([key, label]) => (
          <div key={key} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="font-display font-black text-3xl text-slate-900 mt-1">{stats ? format(key, stats[key]) : '—'}</p>
          </div>
        ))}
      </div>
      <Link to="/dealer/dashboard/inventory/add" className="inline-flex mt-6 bg-[#3083ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3">
        Add a car
      </Link>
    </ProfileCard>
  );
}
