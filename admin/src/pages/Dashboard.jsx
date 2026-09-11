import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/axios';
import { GlassCard, KpiCard, PageHeader, inr } from '../components/admin/ui';

const tooltipStyle = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#e2e8f0' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/metrics').then((r) => setStats(r.data)).catch(() => setStats({
      totalCars: 0, totalUsers: 0, totalDealers: 0, pendingApproval: 0, activeListings: 0,
      pendingKyc: 0, gmv: 0, monthly: [], monthlyGmv: [], activity: [], trends: {},
    }));
  }, []);

  if (!stats) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 skeleton" />)}</div>;
  }

  const listingChart = (stats.monthly || []).map((m) => ({ month: m._id, listings: m.count }));
  const gmvChart = (stats.monthlyGmv || []).map((m) => ({ month: m._id, gmv: m.total }));

  return (
    <div className="space-y-6">
      <PageHeader kicker="Command center" title="Dashboard" subtitle="Live inventory, revenue, and operational queues." />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="GMV (tokens paid)" value={inr(stats.gmv)} delta={stats.trends?.gmv} />
        <KpiCard label="Active listings" value={stats.activeListings} />
        <KpiCard label="Pending listing review" value={stats.pendingApproval} />
        <KpiCard label="Pending dealer KYC" value={stats.pendingKyc} />
        <KpiCard label="Customers" value={stats.totalUsers} />
        <KpiCard label="Dealers" value={stats.totalDealers} />
        <KpiCard label="Leads this month" value={stats.thisMonth?.leads ?? 0} delta={stats.trends?.leads} />
        <KpiCard label="Open tickets" value={stats.openTickets ?? 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-4">Listings — last 6 months</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={listingChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="listings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-4">Token GMV</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={gmvChart}>
              <defs>
                <linearGradient id="gmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="gmv" stroke="#10b981" fill="url(#gmv)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h3 className="font-semibold text-white mb-4">Live activity</h3>
        <div className="space-y-3">
          {(stats.activity || []).length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
          {(stats.activity || []).map((row) => (
            <div key={`${row.type}-${row.id}`} className="flex items-start justify-between gap-3 border-b border-slate-800/60 pb-3">
              <div>
                <p className="text-sm font-bold text-white">{row.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{row.body}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{row.type}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
