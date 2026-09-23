import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search } from 'lucide-react';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import { mediaUrl } from '../pages/profile/hubUtils';
import { formatKm, formatPrice } from '../utils/format';
import { BUDGETS, budgetQuery } from '../utils/filterOptions';
import { fetchRecentlyViewed, readRecentlyViewed, subscribeRecentlyViewed } from '../lib/recentlyViewed';

const SERVICES = [
  { title: 'Buy Certified Cars', hint: 'Inspected used cars', to: '/cars', badge: 'Verified' },
  { title: 'Sell Your Car', hint: 'Doorstep evaluation', to: '/sell', badge: 'Instant' },
  { title: 'Car Finance & EMI', hint: 'Rates from 8.5%', to: '/finance', badge: 'EMI' },
  { title: 'Insurance Renewal', hint: 'Paperless cover', to: '/insurance', badge: 'Cover' },
];

const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const BODIES = ['Hatchback', 'Sedan', 'SUV', 'MUV'];

function carImage(car) {
  const img = car?.images?.[0];
  if (!img) return '';
  return String(img).startsWith('http') ? img : mediaUrl(img);
}

function CarStrip({ cars }) {
  if (!cars.length) return <p className="text-[12px] font-semibold text-slate-400 px-1">No cars listed yet.</p>;
  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1">
      {cars.map((car) => (
        <Link key={car._id} to={`/cars/${car._id}`} className="shrink-0 w-[168px] bg-white rounded-2xl overflow-hidden border border-[#3083ff]/15">
          <div className="h-[100px] bg-slate-100">
            {carImage(car) ? <img src={carImage(car)} alt="" className="w-full h-full object-cover" /> : null}
          </div>
          <div className="p-2.5">
            <p className="text-[12px] font-black text-slate-900 line-clamp-1">{car.title}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
              {[car.kmDriven != null ? formatKm(car.kmDriven) : null, car.fuel].filter(Boolean).join(' · ')}
            </p>
            <p className="text-[13px] font-black text-[#1853ff] mt-1">{formatPrice(car.price)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Panel({ title, action, href, children, tint = false }) {
  return (
    <section className={`rounded-2xl p-3 border ${tint ? 'bg-[#eef5ff] border-[#3083ff]/15' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center justify-between px-0.5 mb-2.5">
        <h2 className="text-[15px] font-black text-slate-900">{title}</h2>
        {href && (
          <Link to={href} className="text-[12px] font-black text-[#3083ff]">
            {action || 'View all'}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default function MobileHome() {
  const navigate = useNavigate();
  const { brands } = useReferenceData();
  const userId = useSelector((s) => s.auth?.user?._id || s.auth?.user?.id || '');
  const isAuthed = useSelector((s) => Boolean(s.auth?.user && s.auth?.token));
  const [query, setQuery] = useState('');
  const [latest, setLatest] = useState([]);
  const [premium, setPremium] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/cars', { params: { sort: '-createdAt', limit: 8 } }).catch(() => ({ data: { cars: [] } })),
      api.get('/cars', { params: { minPrice: 1500000, limit: 8, sort: '-createdAt' } }).catch(() => ({ data: { cars: [] } })),
    ]).then(([l, p]) => {
      if (cancelled) return;
      setLatest(l.data?.cars || []);
      setPremium(p.data?.cars || []);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAuthed || !userId) {
      setRecent([]);
      return undefined;
    }
    setRecent(readRecentlyViewed(userId));
    let cancelled = false;
    fetchRecentlyViewed(userId).then((rows) => { if (!cancelled) setRecent(rows); });
    const unsub = subscribeRecentlyViewed((next) => { if (!cancelled) setRecent(next); }, () => userId);
    return () => { cancelled = true; unsub(); };
  }, [isAuthed, userId]);

  const search = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/cars?search=${encodeURIComponent(q)}` : '/cars');
  };

  return (
    <div className="lg:hidden bg-[#f3f6fb] min-h-screen pb-4">
      <form onSubmit={search} className="bg-white px-3 pt-2 pb-3 border-b border-slate-100">
        <div className="flex items-center h-11 rounded-xl border border-[#3083ff]/30 bg-white overflow-hidden">
          <span className="px-3 h-full flex items-center text-[13px] font-black text-[#1853ff] bg-[#eef5ff] border-r border-[#3083ff]/20 shrink-0">
            Used
          </span>
          <Search className="w-4 h-4 text-[#3083ff] ml-2.5 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Swift, Honda, or 5 lakh"
            className="flex-1 min-w-0 h-full px-2 text-[13px] font-semibold bg-transparent outline-none"
          />
        </div>
      </form>

      <div className="px-3 pt-3 space-y-3">
        <Panel title="Find your right car">
          <div className="grid grid-cols-2 gap-2">
            {SERVICES.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-2xl bg-[#eef5ff] border border-[#3083ff]/15 p-3 min-h-[104px] flex flex-col"
              >
                <span className="w-fit text-[10px] font-black uppercase tracking-wide text-[#1853ff] bg-white border border-[#3083ff]/20 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
                <p className="text-[14px] font-black text-slate-900 leading-tight mt-2">{item.title}</p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{item.hint}</p>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-2">
          <Link to={recent[0] ? `/cars/${recent[0].id}` : '/cars'} className="rounded-2xl bg-white border border-slate-100 p-3">
            <p className="text-[13px] font-black text-slate-900">Last viewed</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-2">
              {recent[0]?.title || 'Cars you open will show here'}
            </p>
          </Link>
          <Link to="/valuation" className="rounded-2xl bg-white border border-[#3083ff]/20 p-3">
            <p className="text-[13px] font-black text-slate-900">Car valuation</p>
            <p className="text-[11px] font-semibold text-[#3083ff] mt-1">Check a fair price</p>
          </Link>
        </div>

        {recent.length > 0 && (
          <Panel title="Your activity" tint>
            <p className="text-[12px] font-black text-[#1853ff] border-b-2 border-[#3083ff] w-fit -mt-1 mb-2.5 pb-0.5">Last viewed</p>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
              {recent.slice(0, 8).map((car) => (
                <Link key={car.id} to={`/cars/${car.id}`} className="shrink-0 w-[150px] bg-white rounded-xl overflow-hidden border border-white">
                  <div className="h-[86px] bg-slate-100">
                    {car.thumb ? <img src={mediaUrl(car.thumb)} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="p-2">
                    <p className="text-[12px] font-black text-slate-900 line-clamp-1">{car.title}</p>
                    <p className="text-[12px] font-black text-[#1853ff] mt-0.5">{formatPrice(car.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Latest used cars" href="/cars?sort=-createdAt">
          <CarStrip cars={latest} />
        </Panel>

        <Panel title="Shop by budget">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {BUDGETS.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => {
                  const q = new URLSearchParams(budgetQuery(b)).toString();
                  navigate(`/cars?${q}`);
                }}
                className="shrink-0 px-3 h-9 rounded-full bg-white border border-[#3083ff]/25 text-[12px] font-black text-[#1853ff]"
              >
                {b.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Popular brands" href="/brands" action="All brands">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {brands.slice(0, 12).map((b) => (
              <Link
                key={b._id}
                to={`/cars?brand=${b._id}`}
                className="shrink-0 w-[76px] h-[76px] rounded-2xl bg-[#eef5ff] border border-[#3083ff]/10 flex flex-col items-center justify-center gap-1 px-1"
              >
                {b.logo ? (
                  <img src={mediaUrl(b.logo)} alt="" className="h-7 max-w-[52px] object-contain" />
                ) : (
                  <span className="text-[11px] font-black text-[#1853ff]">{b.name.slice(0, 2).toUpperCase()}</span>
                )}
                <span className="text-[10px] font-bold text-slate-700 line-clamp-1">{b.name}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Premium cars" href="/cars?minPrice=1500000">
          <p className="text-[11px] font-semibold text-slate-500 -mt-1 mb-2">Above ₹15 Lakh</p>
          <CarStrip cars={premium} />
        </Panel>

        <Panel title="Browse by category">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-1.5">Fuel</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FUELS.map((fuel) => (
              <Link key={fuel} to={`/cars?fuel=${fuel}`} className="px-3 h-8 rounded-full bg-[#eef5ff] text-[12px] font-black text-[#1853ff] inline-flex items-center">
                {fuel}
              </Link>
            ))}
          </div>
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-1.5">Body</p>
          <div className="flex flex-wrap gap-1.5">
            {BODIES.map((body) => (
              <Link key={body} to={`/cars?bodyType=${body}`} className="px-3 h-8 rounded-full border border-[#3083ff]/25 text-[12px] font-black text-slate-800 inline-flex items-center">
                {body}
              </Link>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-3 gap-2 pb-2">
          {[
            ['Compare', '/compare'],
            ['Offers', '/offers'],
            ['Contact', '/contact'],
          ].map(([label, to]) => (
            <Link key={to} to={to} className="bg-white rounded-xl border border-[#3083ff]/15 py-3 text-center text-[12px] font-black text-[#1853ff]">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
