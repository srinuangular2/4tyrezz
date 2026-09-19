import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Car, CircleCheck, Clock3, Eye, Plus, ShoppingBag, Upload } from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';
import { GlassCard, KpiCard, PageHeader, StatusBadge, btnGhost, btnPrimary } from '../../components/dealer/ui';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function carBucket(car) {
  const status = String(car.status || '').toLowerCase();
  const listing = String(car.listingStatus || '').toUpperCase();
  if (status === 'sold' || listing === 'SOLD') return 'sold';
  if (['pending', 'pending_moderation', 'draft'].includes(status) || ['PENDING_MODERATION', 'DRAFT'].includes(listing)) {
    return 'pending';
  }
  if ((status === 'approved' || listing === 'PUBLISHED') && !car.unpublished) return 'live';
  return 'other';
}

function listingLabel(car) {
  const bucket = carBucket(car);
  if (bucket === 'sold') return 'Sold';
  if (bucket === 'pending') return 'Pending';
  if (car.unpublished) return 'Hidden';
  if (bucket === 'live') return 'Published';
  return car.listingStatus || car.status || 'Draft';
}

function settlementLabel(status) {
  const v = String(status || '').toLowerCase();
  if (v === 'paid') return 'With 4tyrezz';
  if (v === 'refunded') return 'Refunded';
  if (v === 'failed') return 'Failed';
  if (v === 'pending' || v === 'created') return 'Pending';
  return status || '—';
}

function paymentDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerAnalytics() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState(null);
  const [payments, setPayments] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/dealer/dashboard/kpis').then((r) => r.data.data).catch(() => ({})),
      api.get('/dealer/inventory').then((r) => r.data.data || []).catch(() => []),
      api.get('/payments', { params: { limit: 8 } }).then((r) => r.data.data || []).catch(() => []),
    ]).then(([nextStats, nextCars, nextPayments]) => {
      setStats(nextStats);
      setCars(nextCars);
      setPayments(nextPayments);
    });
  }, []);

  const inventory = cars || [];
  const total = Number(stats?.totalInventory ?? inventory.length);
  const pending = Number(stats?.pendingListings ?? inventory.filter((c) => carBucket(c) === 'pending').length);
  const live = Number(stats?.activeListings ?? inventory.filter((c) => carBucket(c) === 'live').length);
  const sold = Number(stats?.soldCars ?? inventory.filter((c) => carBucket(c) === 'sold').length);
  const topViewed = useMemo(
    () => [...inventory].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 5),
    [inventory]
  );
  const maxViews = Math.max(1, ...topViewed.map((c) => Number(c.views || 0)));
  const recent = useMemo(
    () => [...inventory].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6),
    [inventory]
  );
  const showroom = user?.dealershipName || user?.name || 'Dealer';
  const collected = (payments || []).filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Showroom"
        title={`${greeting()}, ${showroom}`}
        subtitle="Upload cars. 4tyrezz handles buyers, payments and payouts."
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
        <KpiCard icon={Car} tone="slate" label="Total cars" value={stats || cars ? total : '—'} hint="All vehicles in this showroom" />
        <KpiCard icon={Clock3} tone="amber" label="Waiting for admin" value={stats || cars ? pending : '—'} hint="Buyers cannot see these yet" />
        <KpiCard icon={CircleCheck} tone="emerald" label="Live on 4tyrezz" value={stats || cars ? live : '—'} hint="Showing on the marketplace now" />
        <KpiCard icon={ShoppingBag} tone="blue" label="Sold" value={stats || cars ? sold : '—'} hint="Closed from this showroom" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Settlements</p>
          <h3 className="font-display font-black text-lg text-slate-900 mt-1">Payment history</h3>
          <p className="text-sm text-slate-500 mt-1">
            Buyers pay 4tyrezz. Token and sale money collected for your cars
            {payments?.length ? ` · ${formatPrice(collected)}` : ''}
          </p>
          {!payments ? (
            <p className="text-sm font-semibold text-slate-400 mt-5">Loading payments…</p>
          ) : payments.length ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-2 font-black">Date</th>
                    <th className="pb-2 font-black">Car</th>
                    <th className="pb-2 font-black">Amount</th>
                    <th className="pb-2 font-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((row) => (
                    <tr key={row._id}>
                      <td className="py-3 pr-3 font-semibold text-slate-600">{paymentDate(row.createdAt)}</td>
                      <td className="py-3 pr-3 font-bold text-slate-900">{row.vehicle?.title || '—'}</td>
                      <td className="py-3 pr-3 font-black text-slate-900">{formatPrice(row.amount)}</td>
                      <td className="py-3"><StatusBadge value={settlementLabel(row.status)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500 mt-5">
              No settlements yet. When a buyer pays 4tyrezz for your car, it appears here.
            </p>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Buyer interest</p>
          <h3 className="font-display font-black text-lg text-slate-900 mt-1">Which cars get the most views?</h3>
          <p className="text-sm text-slate-500 mt-1">Longer bar = more people opened that listing.</p>
          <div className="mt-5 space-y-3.5">
            {topViewed.length ? topViewed.map((car, index) => {
              const views = Number(car.views || 0);
              return (
                <Link key={car._id} to={`/dealer/dashboard/inventory/edit/${car._id}`} className="block group">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-bold text-slate-900 truncate">
                      <span className="text-slate-400 mr-1">{index + 1}.</span>
                      {car.title}
                    </p>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[12px] font-black text-slate-500">
                      <Eye size={13} /> {views}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#3083ff] group-hover:bg-[#1853ff] transition-all"
                      style={{ width: `${Math.max(8, (views / maxViews) * 100)}%` }}
                    />
                  </div>
                </Link>
              );
            }) : (
              <p className="text-sm font-semibold text-slate-500 py-6">Views appear after buyers open your listings.</p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Latest stock</p>
            <h3 className="font-display font-black text-lg text-slate-900 mt-1">Recently added cars</h3>
          </div>
          <Link to="/dealer/dashboard/inventory" className="text-[12px] font-black uppercase tracking-wider text-[#3083ff]">
            Open full inventory
          </Link>
        </div>
        {!cars ? (
          <p className="text-sm font-semibold text-slate-400">Loading listings…</p>
        ) : recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-2 font-black">Car</th>
                  <th className="pb-2 font-black">Price</th>
                  <th className="pb-2 font-black">Status</th>
                  <th className="pb-2 font-black text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((car) => (
                  <tr key={car._id}>
                    <td className="py-3 pr-3">
                      <Link to={`/dealer/dashboard/inventory/edit/${car._id}`} className="font-bold text-slate-900 hover:text-[#3083ff]">
                        {car.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 font-semibold text-slate-700">{formatPrice(car.price)}</td>
                    <td className="py-3 pr-3"><StatusBadge value={listingLabel(car)} /></td>
                    <td className="py-3 text-right font-bold text-slate-600 tabular-nums">{Number(car.views || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">No cars in this showroom yet. Add a listing to get started.</p>
        )}
      </GlassCard>
    </div>
  );
}
