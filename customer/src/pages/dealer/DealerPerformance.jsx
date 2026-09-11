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
import { ProfileCard } from '../profile/ProfileLayout';

export default function DealerPerformance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dealer/analytics/reports').then((r) => setData(r.data.data)).catch(() => setData({}));
  }, []);

  const funnel = data?.funnel || {};
  const funnelRows = [
    { name: 'Leads received', value: funnel.leadsReceived || 0 },
    { name: 'Response rate %', value: funnel.responseRate || 0 },
    { name: 'Test drives taken', value: funnel.testDrivesTaken || 0 },
    { name: 'Bookings', value: funnel.bookings || 0 },
    { name: 'Sales conversion %', value: funnel.conversionRate || 0 },
  ];
  const top = data?.topInventory || [];
  const engagement = data?.engagement || [];
  const elasticity = data?.elasticity || [];

  return (
    <ProfileCard eyebrow="Insights" title="Dealer analytics hub">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="h-72">
          <h3 className="font-black text-slate-900 mb-3">Funnel performance</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelRows} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3083ff" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72">
          <h3 className="font-black text-slate-900 mb-3">Top performing inventory</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#94a3b8" name="Views" />
              <Bar dataKey="enquiries" fill="#3083ff" name="Enquiries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72">
          <h3 className="font-black text-slate-900 mb-3">Engagement matrix</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="views" name="Page views" />
              <YAxis dataKey="enquiries" name="Enquiries" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={engagement.map((e) => ({ ...e, enquiries: (e.enquiries || 0) + (e.phone || 0) + (e.whatsapp || 0) }))} fill="#3083ff" />
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
                    <td className="py-2 font-semibold">{row.title}</td>
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
    </ProfileCard>
  );
}
