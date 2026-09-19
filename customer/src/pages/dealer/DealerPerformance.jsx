import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../api/axios';
import { GlassCard, PageHeader } from '../../components/dealer/ui';

export default function DealerPerformance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dealer/analytics/reports').then((r) => setData(r.data.data)).catch(() => setData({}));
  }, []);

  const funnel = data?.funnel || {};
  const funnelRows = [
    { name: 'Pending approval', value: funnel.pending || 0 },
    { name: 'Live on 4tyrezz', value: funnel.live || 0 },
    { name: 'Sold', value: funnel.sold || 0 },
    { name: 'Total inventory', value: funnel.total || 0 },
  ];
  const top = data?.topInventory || [];
  const engagement = data?.engagement || [];
  const elasticity = data?.elasticity || [];

  return (
    <div className="space-y-6">
      <PageHeader kicker="Insights" title="Dealer analytics hub" subtitle="Funnel, engagement and price-drop performance." />
      <GlassCard className="p-5">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="h-72">
          <h3 className="font-black text-slate-900 mb-3">Funnel performance</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelRows} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#0f172a' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72">
          <h3 className="font-black text-slate-900 mb-3">Top performing inventory</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="model" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#0f172a' }} />
              <Bar dataKey="views" fill="#3b82f6" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72">
          <h3 className="font-black text-slate-900 mb-3">Engagement matrix</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="views" name="Page views" tick={{ fill: '#64748b' }} />
              <YAxis dataKey="views" name="Views" tick={{ fill: '#64748b' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#0f172a' }} />
              <Scatter data={engagement} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="font-black text-slate-900 mb-3">Price elasticity tracker</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-black uppercase text-slate-400">
                <tr className="text-left">
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Drops</th>
                  <th className="py-2">Leads after drop</th>
                  <th className="py-2">Days to convert</th>
                </tr>
              </thead>
              <tbody>
                {elasticity.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="py-2 font-semibold text-slate-900">{row.title}</td>
                    <td className="py-2">{row.drops}</td>
                    <td className="py-2">{row.leadsAfterDrop}</td>
                    <td className="py-2">{row.conversionSpeedDays ?? '—'}</td>
                  </tr>
                ))}
                {!elasticity.length && (
                  <tr><td colSpan={4} className="py-6 text-slate-400 font-semibold">Price-drop history appears after you change listing prices.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </GlassCard>
    </div>
  );
}
