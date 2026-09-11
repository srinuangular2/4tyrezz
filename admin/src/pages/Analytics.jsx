import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/axios';
import { GlassCard, KpiCard, PageHeader, inr } from '../components/admin/ui';

const tip = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 };

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/reports').then((r) => setData(r.data)).catch(() => setData({
      gmvSeries: [], leadSeries: [], soldSeries: [], leadFunnel: [], inventory: [], inventoryTurnoverPercent: 0,
    }));
  }, []);

  if (!data) return <div className="h-64 skeleton" />;

  const months = Array.from(new Set([
    ...(data.gmvSeries || []).map((r) => r._id),
    ...(data.leadSeries || []).map((r) => r._id),
    ...(data.soldSeries || []).map((r) => r._id),
  ])).sort();
  const merged = months.map((m) => ({
    month: m,
    gmv: data.gmvSeries.find((r) => r._id === m)?.gmv || 0,
    leads: data.leadSeries.find((r) => r._id === m)?.leads || 0,
    sold: data.soldSeries.find((r) => r._id === m)?.sold || 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader kicker="Intelligence" title="Reports & analytics" subtitle="Platform GMV, lead conversion, and inventory turnover from live records." />
      <div className="grid md:grid-cols-3 gap-4">
        <KpiCard label="Inventory turnover" value={`${data.inventoryTurnoverPercent || 0}%`} hint="Sold / (live + sold)" />
        <KpiCard label="Lead stages" value={(data.leadFunnel || []).length} hint="Distinct CRM stages" />
        <KpiCard label="Listing statuses" value={(data.inventory || []).reduce((s, r) => s + r.count, 0)} />
      </div>
      <GlassCard className="p-5">
        <h3 className="font-semibold text-white mb-4">GMV vs leads vs sold units</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={tip} />
            <Area type="monotone" dataKey="gmv" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
            <Area type="monotone" dataKey="leads" stroke="#10b981" fill="#10b981" fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-4">Lead funnel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.leadFunnel || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="_id" width={140} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="font-semibold text-white mb-3">Inventory mix</h3>
          <ul className="space-y-2">
            {(data.inventory || []).map((row) => (
              <li key={row._id} className="flex justify-between text-sm">
                <span className="text-slate-400 capitalize">{row._id || 'unknown'}</span>
                <span className="font-bold text-white">{row.count}</span>
              </li>
            ))}
            {!data.inventory?.length && <p className="text-slate-500 text-sm">No inventory yet.</p>}
          </ul>
          <p className="text-xs text-slate-500 mt-4">GMV figures are token payments recorded as paid ({inr((data.gmvSeries || []).reduce((s, r) => s + r.gmv, 0))} across the window).</p>
        </GlassCard>
      </div>
    </div>
  );
}
