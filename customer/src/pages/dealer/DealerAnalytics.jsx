import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Car, CircleCheck, Clock3, Eye, IndianRupee, Megaphone, Plus, ShoppingBag, Upload, Wallet } from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';
import { mediaUrl } from '../profile/hubUtils';
import { StatusBadge } from '../../components/dealer/ui';

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

const STRIPES = {
  backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.08) 22px 44px)',
};

const ACTIONS = [
  { to: '/dealer/dashboard/inventory/add', label: 'Add a car', icon: Plus, tone: 'bg-[#3083ff]' },
  { to: '/dealer/dashboard/inventory', label: 'Stock', icon: Car, tone: 'bg-[#0f7a45]' },
  { to: '/dealer/dashboard/inventory/bulk', label: 'Bulk upload', icon: Upload, tone: 'bg-[#d97706]' },
  { to: '/dealer/dashboard/promotions', label: 'Offers', icon: Megaphone, tone: 'bg-[#7c3aed]' },
];

const BAR_COLORS = ['bg-[#3083ff]', 'bg-[#0f7a45]', 'bg-[#d97706]', 'bg-[#7c3aed]', 'bg-[#be123c]'];

function paymentDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerAnalytics() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState(null);
  const [payments, setPayments] = useState(null);
  const [bucket, setBucket] = useState('all');

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
  const recent = useMemo(() => {
    const rows = [...inventory].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const picked = bucket === 'all' ? rows : rows.filter((car) => carBucket(car) === bucket);
    return picked.slice(0, 6);
  }, [inventory, bucket]);
  const showroom = user?.dealershipName || user?.name || 'Dealer';
  const collected = (payments || []).filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const tiles = [
    { key: 'all', icon: Car, label: 'Cars', value: stats || cars ? total : '—', tone: 'from-[#7eb6f5] to-[#d7ebff]', mark: 'bg-[#1853ff]' },
    { key: 'pending', icon: Clock3, label: 'Waiting', value: stats || cars ? pending : '—', tone: 'from-[#ffd56a] to-[#fff0c8]', mark: 'bg-[#9a6700]' },
    { key: 'live', icon: CircleCheck, label: 'Live', value: stats || cars ? live : '—', tone: 'from-[#7ddeb4] to-[#d8f5e8]', mark: 'bg-[#0f7a45]' },
    { key: 'sold', icon: ShoppingBag, label: 'Sold', value: stats || cars ? sold : '—', tone: 'from-[#c4a6f5] to-[#eee4fc]', mark: 'bg-[#6d28d9]' },
  ];

  const stockTitle = tiles.find((tile) => tile.key === bucket)?.label || 'Cars';

  return (
    <div className="space-y-4 lg:space-y-6">
      <section className="relative -mx-3 -mt-3 overflow-hidden bg-[#3083ff] px-4 pb-5 pt-4 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={STRIPES} />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white/80">{greeting()}</p>
            <h1 className="truncate text-[20px] font-medium sm:text-[28px]">{showroom}</h1>
            <p className="mt-1 text-[12px] font-normal text-white/80">
              {user?.dealerCode || 'Showroom dashboard'}
              {payments?.length ? ` · ${formatPrice(collected)} collected` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dealer/dashboard/inventory/bulk" className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-[13px] font-medium text-white">
              <Upload className="h-4 w-4" /> Bulk
            </Link>
            <Link to="/dealer/dashboard/inventory/add" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] font-medium text-[#1853ff]">
              <Plus className="h-4 w-4" /> Add a car
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map(({ key, icon: Icon, label, value, tone, mark }) => (
          <button
            key={key}
            type="button"
            aria-pressed={bucket === key}
            onClick={() => setBucket(key)}
            className={`rounded-[22px] bg-gradient-to-br ${tone} p-3 text-left shadow-[0_8px_20px_rgba(15,23,42,0.06)] lg:p-4 ${bucket === key ? 'ring-2 ring-[#1853ff] ring-offset-2' : ''}`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${mark}`}>
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <p className="mt-3 text-[22px] font-medium leading-none text-slate-900 lg:text-[28px]">{value}</p>
            <p className="mt-1 text-[12px] font-medium text-slate-700">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ to, label, icon: Icon, tone }) => (
          <Link key={to} to={to} className="rounded-2xl bg-white p-2 text-center shadow-[0_8px_20px_rgba(15,23,42,0.05)] lg:flex lg:items-center lg:gap-3 lg:p-3 lg:text-left">
            <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-white lg:mx-0 ${tone}`}>
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="mt-1.5 block text-[11px] font-medium leading-tight text-slate-800 lg:mt-0 lg:text-[14px]">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] lg:p-5">
          <h2 className="inline-flex items-center gap-2 text-[16px] font-medium text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#1853ff]"><Wallet className="h-4 w-4" /></span>
            Payments
          </h2>
          <p className="mt-1 text-[12px] font-normal text-slate-500">Buyers pay 4tyrezz. Money for your cars shows here.</p>
          {!payments ? (
            <p className="mt-4 text-[13px] font-medium text-slate-400">Loading payments…</p>
          ) : payments.length ? (
            <div className="mt-3 space-y-2">
              {payments.map((row) => (
                <div key={row._id} className="flex items-center gap-3 rounded-2xl bg-[#f4f7fb] px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3083ff] text-white"><IndianRupee className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-800">{row.vehicle?.title || 'Payment'}</p>
                    <p className="text-[12px] font-normal text-slate-500">{paymentDate(row.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-medium text-[#1853ff]">{formatPrice(row.amount)}</p>
                    <StatusBadge value={settlementLabel(row.status)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[13px] font-medium text-slate-500">No settlements yet. When a buyer pays 4tyrezz for your car, it appears here.</p>
          )}
        </section>

        <section className="rounded-[24px] bg-[#061a4a] p-4 text-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] lg:p-5">
          <h2 className="inline-flex items-center gap-2 text-[16px] font-medium">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15"><Eye className="h-4 w-4" /></span>
            Most viewed
          </h2>
          <p className="mt-1 text-[12px] font-normal text-white/70">Longer bar means more people opened that listing.</p>
          <div className="mt-4 space-y-3">
            {topViewed.length ? topViewed.map((car, index) => {
              const views = Number(car.views || 0);
              return (
                <Link key={car._id} to={`/dealer/dashboard/inventory/edit/${car._id}`} className="block">
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <p className="truncate font-medium">
                      <span className="mr-1 font-normal text-white/50">{index + 1}.</span>
                      {car.title}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-white/70">
                      <Eye className="h-3.5 w-3.5" /> {views}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                    <div className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`} style={{ width: `${Math.max(8, (views / maxViews) * 100)}%` }} />
                  </div>
                </Link>
              );
            }) : (
              <p className="py-6 text-[13px] font-medium text-white/70">Views appear after buyers open your listings.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] lg:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-2 text-[16px] font-medium text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e7f8ef] text-[#0f7a45]"><Car className="h-4 w-4" /></span>
              {bucket === 'all' ? 'Latest stock' : stockTitle}
            </h2>
            <p className="mt-1 text-[12px] font-normal text-slate-500">Tap a count above to filter this list.</p>
          </div>
          <Link to="/dealer/dashboard/inventory" className="text-[13px] font-medium text-[#1853ff]">See all</Link>
        </div>
        {!cars ? (
          <p className="mt-4 text-[13px] font-medium text-slate-400">Loading listings…</p>
        ) : !recent.length ? (
          <p className="mt-4 text-[13px] font-medium text-slate-500">
            {bucket === 'all' ? 'No cars in this showroom yet. Add a listing to get started.' : `No ${stockTitle.toLowerCase()} cars yet.`}
          </p>
        ) : (
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {recent.map((car) => {
              const photo = mediaUrl(car.images?.[0]);
              return (
                <Link key={car._id} to={`/dealer/dashboard/inventory/edit/${car._id}`} className="flex items-center gap-3 rounded-2xl bg-[#f4f7fb] p-2">
                  {photo ? (
                    <img src={photo} alt="" className="h-14 w-16 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-14 w-16 items-center justify-center rounded-xl bg-[#3083ff] text-white">
                      <Car className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-800">{car.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] font-normal text-slate-500">
                      {formatPrice(car.price)}
                      <StatusBadge value={listingLabel(car)} />
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-normal text-slate-500">
                    <Eye className="h-3.5 w-3.5" /> {Number(car.views || 0)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
