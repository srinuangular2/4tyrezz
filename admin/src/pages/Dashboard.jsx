import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import {
  DirectionsCarOutlined, PeopleOutline, StorefrontOutlined, FactCheckOutlined, CheckCircleOutline,
} from '@mui/icons-material';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => setStats({ totalCars: 0, totalUsers: 0, totalDealers: 0, pendingApproval: 0, activeListings: 0, monthly: [] })); }, []);

  if (!stats) return <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 skeleton" />)}</div>;

  const chartData = stats.monthly.map((m) => ({ month: m._id, listings: m.count }));

  return (
    <div className="space-y-6">
      <h1 className="font-display font-black text-2xl">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Cars" value={stats.totalCars} icon={DirectionsCarOutlined} tone="ink" />
        <StatCard label="Total Users" value={stats.totalUsers} icon={PeopleOutline} tone="white" />
        <StatCard label="Dealers" value={stats.totalDealers} icon={StorefrontOutlined} tone="white" />
        <StatCard label="Pending Approval" value={stats.pendingApproval} icon={FactCheckOutlined} tone="ember" />
        <StatCard label="Active Listings" value={stats.activeListings} icon={CheckCircleOutline} tone="verify" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Listings added — last 6 months</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="listings" fill="#E8491D" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
