import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CircleCheck,
  Clock3,
  IdCard,
  ImagePlus,
  Plus,
  ShoppingBag,
  Sparkles,
  Upload,
} from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';
import { GlassCard, KpiCard, PageHeader, btnGhost, btnPrimary } from '../../components/dealer/ui';

function carBucket(car) {
  const status = String(car.status || '').toLowerCase();
  const listing = String(car.listingStatus || '').toUpperCase();
  if (status === 'sold') return 'sold';
  if (['pending', 'pending_moderation', 'draft'].includes(status) || ['PENDING_MODERATION', 'DRAFT'].includes(listing)) {
    return 'pending';
  }
  if ((status === 'approved' || listing === 'PUBLISHED') && !car.unpublished) return 'live';
  return 'other';
}

function daysSince(value) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DealerAnalytics() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/dealer/dashboard/kpis').then((r) => r.data.data).catch(() => ({})),
      api.get('/dealer/inventory').then((r) => r.data.data || []).catch(() => []),
    ]).then(([nextStats, nextCars]) => {
      setStats(nextStats);
      setCars(nextCars);
    });
  }, []);

  const inventory = cars || [];
  const total = Number(stats?.totalInventory ?? inventory.length);
  const pending = Number(stats?.pendingListings ?? inventory.filter((c) => carBucket(c) === 'pending').length);
  const live = Number(stats?.activeListings ?? inventory.filter((c) => carBucket(c) === 'live').length);
  const sold = Number(stats?.soldCars ?? inventory.filter((c) => carBucket(c) === 'sold').length);
  const liveCars = inventory.filter((c) => carBucket(c) === 'live');
  const tasks = useMemo(() => {
    const items = [];
    if (!user?.kycVerified) {
      items.push({
        key: 'kyc',
        tone: 'amber',
        title: 'Finish KYC so inventory can stay unlocked',
        detail: 'Admin must approve documents before buyers see new cars.',
        to: '/dealer/dashboard/onboarding',
        cta: 'Open KYC',
      });
    }
    if (pending > 0) {
      items.push({
        key: 'pending',
        tone: 'amber',
        title: `${pending} listing${pending === 1 ? '' : 's'} waiting for admin`,
        detail: 'Buyers cannot see these until 4tyrezz approves them.',
        to: '/dealer/dashboard/inventory',
        cta: 'Check listings',
      });
    }
    const aging = liveCars.filter((c) => daysSince(c.createdAt) >= 21);
    if (aging.length) {
      items.push({
        key: 'aging',
        tone: 'rose',
        title: `${aging.length} car${aging.length === 1 ? '' : 's'} live for 21+ days`,
        detail: 'Old stock usually needs a price drop or a promotion boost.',
        to: '/dealer/dashboard/promotions',
        cta: 'Boost stock',
      });
    }
    if (!inventory.length) {
      items.push({
        key: 'empty',
        tone: 'blue',
        title: 'Add your first car',
        detail: 'Live inventory is what buyers search on 4tyrezz.',
        to: '/dealer/dashboard/inventory/add',
        cta: 'Add a car',
      });
    }
    return items.slice(0, 4);
  }, [user?.kycVerified, pending, liveCars, inventory.length]);

  const showroom = user?.dealershipName || user?.name || 'Dealer';

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Showroom"
        title={`${greeting()}, ${showroom}`}
        subtitle="Today’s numbers and the next action. Full stock stays in Inventory."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/dealer/dashboard/inventory/bulk" className={btnGhost}>
              <Upload size={15} /> Bulk upload
            </Link>
            <Link to="/dealer/dashboard/inventory/add" className={btnPrimary}>
              <Plus size={16} /> Add a car
            </Link>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Car} tone="slate" label="Total cars" value={stats ? total : '—'} hint="Entire showroom stock" />
        <KpiCard icon={Clock3} tone="amber" label="Waiting for admin" value={stats ? pending : '—'} hint="Not public yet" />
        <KpiCard icon={CircleCheck} tone="emerald" label="Live on 4tyrezz" value={stats ? live : '—'} hint="Showing on the marketplace now" />
        <KpiCard icon={ShoppingBag} tone="blue" label="Sold" value={stats ? sold : '—'} hint="Closed from this showroom" />
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <GlassCard className="p-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Do next</p>
          <h3 className="font-display font-black text-lg text-slate-900 mt-1">Work that moves cars</h3>
          <p className="text-sm text-slate-500 mt-1">Only issues that need you — not a copy of inventory.</p>
          <div className="mt-4 space-y-3">
            {tasks.length ? tasks.map((task) => (
              <div key={task.key} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    task.tone === 'amber' ? 'bg-amber-50 text-amber-600' : task.tone === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-[#EAF2FF] text-[#1853ff]'
                  }`}>
                    <AlertTriangle size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{task.title}</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{task.detail}</p>
                  </div>
                </div>
                <Link to={task.to} className="shrink-0 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#3083ff]">
                  {task.cta} <ArrowRight size={13} />
                </Link>
              </div>
            )) : (
              <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4">
                Showroom looks healthy. No urgent listing work right now.
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Shortcuts</p>
          <h3 className="font-display font-black text-lg text-slate-900 mt-1">Get work done faster</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['Add a car', 'List a vehicle', '/dealer/dashboard/inventory/add', Plus],
              ['Inventory', 'Price and publish', '/dealer/dashboard/inventory', Car],
              ['Promotions', 'Boost slow stock', '/dealer/dashboard/promotions', Sparkles],
              ['Photos / edit', 'Fix a listing', liveCars[0] ? `/dealer/dashboard/inventory/edit/${liveCars[0]._id}` : '/dealer/dashboard/inventory', ImagePlus],
              ['KYC', 'Showroom status', '/dealer/dashboard/onboarding', IdCard],
              ['Bulk upload', 'Add many at once', '/dealer/dashboard/inventory/bulk', Upload],
            ].map(([title, hint, to, Icon]) => (
              <Link key={title} to={to} className="rounded-2xl border border-slate-100 bg-slate-50/70 hover:border-[#3083ff]/40 hover:bg-[#EAF2FF]/50 p-3 transition">
                <Icon size={16} className="text-[#3083ff]" />
                <p className="text-sm font-bold text-slate-900 mt-2">{title}</p>
                <p className="text-[11px] font-semibold text-slate-500">{hint}</p>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      {liveCars.filter((c) => daysSince(c.createdAt) >= 21).length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Fix these first</p>
              <h3 className="font-display font-black text-lg text-slate-900 mt-1">Stock live for 21+ days</h3>
            </div>
            <Link to="/dealer/dashboard/inventory" className="text-[12px] font-black uppercase tracking-wider text-[#3083ff]">
              Inventory
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {liveCars
              .filter((c) => daysSince(c.createdAt) >= 21)
              .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt))
              .slice(0, 4)
              .map((car) => (
                <Link
                  key={car._id}
                  to={`/dealer/dashboard/inventory/edit/${car._id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 rounded-xl px-1"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{car.title}</p>
                    <p className="text-[12px] font-semibold text-slate-500">
                      {formatPrice(car.price)} · {daysSince(car.createdAt)} days live
                    </p>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#3083ff] shrink-0">Edit</span>
                </Link>
              ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
