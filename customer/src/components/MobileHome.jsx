import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BadgeCheck, BadgeIndianRupee, Banknote, Bus, Car, CarFront, ChevronRight, ClipboardCheck, Cloud, Cog, Fuel, Gem, KeyRound, RefreshCw, Scale, ShieldCheck, Truck, Wallet, Zap } from 'lucide-react';
import HowItWorks from './mobile/HowItWorks';
import api from '../api/axios';
import { Heart } from './icons';
import { toggleWishlist } from '../app/wishlistSlice';
import { useAuthGuard } from './AuthGuardModal';
import useReferenceData from '../hooks/useReferenceData';
import { mediaUrl } from '../pages/profile/hubUtils';
import { formatKm, formatPrice } from '../utils/format';
import { budgetQuery } from '../utils/filterOptions';
import { fetchRecentlyViewed, readRecentlyViewed, subscribeRecentlyViewed } from '../lib/recentlyViewed';
import { DEFAULT_TESTIMONIALS } from './TestimonialCard';

const WORK_STEPS = [
  { icon: CarFront, title: 'Pick a car', body: 'Certified listings', tone: 'bg-[#eaf2ff] text-[#1853ff]' },
  { icon: ClipboardCheck, title: 'Doorstep check', body: '140-point report', tone: 'bg-[#e7f8ef] text-emerald-600' },
  { icon: ShieldCheck, title: 'See the score', body: 'Engine and body', tone: 'bg-[#efe4ff] text-violet-600' },
  { icon: KeyRound, title: 'Pay and collect', body: '7-day guarantee', tone: 'bg-[#fff1c9] text-amber-600' },
];

const WHY_START = [
  { icon: BadgeCheck, title: 'Inspected', body: 'Photos and km checked', tone: 'bg-[#e7f8ef] text-emerald-600' },
  { icon: Scale, title: 'Fair price', body: 'Range and EMI shown', tone: 'bg-[#eaf2ff] text-[#1853ff]' },
  { icon: Wallet, title: 'One next step', body: 'Buy, sell or finance', tone: 'bg-[#fff1c9] text-amber-600' },
];

const PROMO_BANNERS = [
  { id: 'used', image: '/used-cars.png', title: 'Drive your dream car today', subtitle: '100% inspected | Clear price', cta: 'Explore cars', href: '/cars' },
  { id: 'offers', image: '/offers.png', title: 'Offers on cars you can trust', subtitle: 'Deals on live, inspected stock', cta: 'View offers', href: '/offers' },
  { id: 'sell', image: '/sell-my-car.png', title: 'Sell from your doorstep', subtitle: 'Free estimate, then a real offer', cta: 'Get a price', href: '/sell' },
  { id: 'finance', image: '/car-finance.png', title: 'EMI that matches the car', subtitle: 'Finance on inspected used cars', cta: 'Check finance', href: '/finance' },
];

const SERVICES = [
  { title: 'Buy Certified Cars', hint: 'Best pre-owned cars', to: '/cars', tone: 'from-[#ffe8d6] to-[#fff6ee]', art: 'buy' },
  { title: 'Sell your car', hint: 'From your home', to: '/sell', tone: 'from-[#d9ecff] to-[#f3f9ff]', art: 'sell' },
  { title: 'Car Inspection', hint: '60 min report', to: '/inspection', tone: 'from-[#d8f6ea] to-[#f3fff8]', art: 'inspect' },
  { title: 'Car Valuation', hint: 'Free price estimate', to: '/valuation', tone: 'from-[#efe4ff] to-[#faf7ff]', art: 'value' },
  { title: 'Finance & EMI', hint: 'Plans from 8.5%', to: '/finance', tone: 'from-[#fff1c9] to-[#fffaf0]', art: 'finance' },
  { title: 'Insurance', hint: 'Renew your cover', to: '/insurance', tone: 'from-[#ffe0ea] to-[#fff7f9]', art: 'insurance' },
];

const HOME_BUDGETS = [
  { label: 'Under ₹3L', max: 300000, icon: Wallet },
  { label: '₹3L – ₹5L', min: 300000, max: 500000, icon: Banknote },
  { label: '₹5L – ₹8L', min: 500000, max: 800000, icon: BadgeIndianRupee },
  { label: 'Above ₹10L', min: 1000000, icon: Gem },
];

const CATEGORIES = [
  {
    title: 'By fuel type',
    param: 'fuel',
    items: [
      { name: 'Petrol', icon: Fuel, tone: 'bg-[#fff4e8] text-[#e07a12]' },
      { name: 'Diesel', icon: Fuel, tone: 'bg-[#e8f1ff] text-[#3083ff]' },
      { name: 'CNG', icon: Cloud, tone: 'bg-[#e7f8ee] text-[#178a45]' },
      { name: 'Electric', icon: Zap, tone: 'bg-[#f3e8ff] text-[#7c3aed]' },
    ],
  },
  {
    title: 'By body style',
    param: 'bodyType',
    items: [
      { name: 'Hatchback', icon: Car, tone: 'bg-[#e8f1ff] text-[#3083ff]' },
      { name: 'Sedan', icon: CarFront, tone: 'bg-[#fff4e8] text-[#e07a12]' },
      { name: 'SUV', icon: Truck, tone: 'bg-[#f3e8ff] text-[#7c3aed]' },
      { name: 'MUV', icon: Bus, tone: 'bg-[#e7f8ee] text-[#178a45]' },
    ],
  },
  {
    title: 'By transmission',
    param: 'transmission',
    items: [
      { name: 'Manual', icon: Cog, tone: 'bg-[#fff4e8] text-[#e07a12]' },
      { name: 'Automatic', icon: RefreshCw, tone: 'bg-[#e8f1ff] text-[#3083ff]' },
    ],
  },
];

const GLASS = 'rounded-2xl bg-white/60 sm:bg-white/40 backdrop-blur-xl border border-slate-200/60 shadow-xs hover:border-blue-500/40 transition-all';

function carImage(car) {
  const img = car?.images?.[0];
  if (!img) return '';
  return String(img).startsWith('http') ? img : mediaUrl(img);
}

function emi(price) {
  const loan = Math.round(Number(price || 0) * 0.9);
  const r = 0.145 / 12;
  const n = 48;
  if (!loan) return 0;
  return Math.round((loan * r * (1 + r) ** n) / ((1 + r) ** n - 1));
}

function bannerHref(banner) {
  if (banner.linkType === 'car' && banner.car) {
    const id = banner.car._id || banner.car;
    return id ? `/cars/${id}` : '/cars';
  }
  if (banner.linkType === 'url' && banner.url) return banner.url;
  return '/cars';
}

function SectionHead({ title, href, action = 'See all' }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3 px-4">
      <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">{title}</h2>
      {href && (
        <Link to={href} className="text-[13px] font-bold text-[#1853ff] inline-flex items-center gap-0.5 min-h-11">
          {action} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function ServiceArt({ kind }) {
  if (kind === 'buy') {
    return (
      <svg viewBox="0 0 160 90" className="w-[92px] h-[50px]" aria-hidden="true">
        <ellipse cx="80" cy="78" rx="52" ry="6" fill="#f3c7a4" />
        <path d="M28 58h92c6 0 10-4 12-10l8-16c1-3-1-6-4-6H78L62 14c-2-3-5-4-8-4H36c-4 0-7 3-8 7L22 42c-1 4 1 8 6 8" fill="#fff" stroke="#f08a4b" strokeWidth="2" />
        <path d="M62 14l16 28H22" fill="#ffe8d2" stroke="#f08a4b" strokeWidth="2" />
        <circle cx="48" cy="64" r="10" fill="#3d4454" />
        <circle cx="48" cy="64" r="4" fill="#d7dde8" />
        <circle cx="108" cy="64" r="10" fill="#3d4454" />
        <circle cx="108" cy="64" r="4" fill="#d7dde8" />
        <path d="M118 36h14" stroke="#ff5a36" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'sell') {
    return (
      <svg viewBox="0 0 160 90" className="w-[92px] h-[50px]" aria-hidden="true">
        <ellipse cx="78" cy="78" rx="50" ry="6" fill="#b9d7f5" />
        <path d="M24 60h86c5 0 9-3 11-8l7-14c1-3-1-6-4-6H74L60 20c-2-3-5-4-8-4H34c-4 0-7 3-8 7L20 46c-1 4 2 8 6 8" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="46" cy="66" r="9" fill="#334155" />
        <circle cx="102" cy="66" r="9" fill="#334155" />
        <circle cx="128" cy="28" r="14" fill="#fff7d6" stroke="#f5b942" strokeWidth="2" />
        <path d="M128 20v6M128 30v6M122 26h6M128 26h6" stroke="#e39b12" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'inspect') {
    return (
      <svg viewBox="0 0 160 90" className="w-[92px] h-[50px]" aria-hidden="true">
        <rect x="46" y="10" width="68" height="72" rx="10" fill="#fff" stroke="#14b8a6" strokeWidth="2" />
        <rect x="58" y="22" width="44" height="6" rx="3" fill="#99f6e4" />
        <rect x="58" y="36" width="44" height="6" rx="3" fill="#ccfbf1" />
        <rect x="58" y="50" width="28" height="6" rx="3" fill="#ccfbf1" />
        <circle cx="112" cy="62" r="16" fill="#14b8a6" />
        <path d="M104 62l6 6 12-12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'value') {
    return (
      <svg viewBox="0 0 160 90" className="w-[92px] h-[50px]" aria-hidden="true">
        <path d="M80 18v48" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
        <path d="M48 30h64" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
        <path d="M48 30l-16 22h32L48 30z" fill="#fff" stroke="#8b5cf6" strokeWidth="2" />
        <path d="M112 30l-16 28h32l-16-28z" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="2" />
        <circle cx="80" cy="74" r="6" fill="#8b5cf6" />
      </svg>
    );
  }
  if (kind === 'finance') {
    return (
      <svg viewBox="0 0 160 90" className="w-[92px] h-[50px]" aria-hidden="true">
        <ellipse cx="58" cy="70" rx="28" ry="8" fill="#f6d98a" />
        <ellipse cx="58" cy="62" rx="28" ry="8" fill="#ffe08a" stroke="#e8b23a" strokeWidth="2" />
        <ellipse cx="58" cy="54" rx="28" ry="8" fill="#fff4cc" stroke="#e8b23a" strokeWidth="2" />
        <rect x="96" y="28" width="40" height="28" rx="6" fill="#fff" stroke="#e8b23a" strokeWidth="2" />
        <path d="M104 42h24" stroke="#d39a1d" strokeWidth="2" strokeLinecap="round" />
        <circle cx="124" cy="64" r="12" fill="#fff" stroke="#e8b23a" strokeWidth="2" />
        <path d="M124 58v12M120 62h8" stroke="#d39a1d" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 90" className="w-[92px] h-[50px]" aria-hidden="true">
      <path d="M80 12l36 14v24c0 18-14 30-36 36-22-6-36-18-36-36V26l36-14z" fill="#fff" stroke="#f43f5e" strokeWidth="2" />
      <path d="M68 46l8 8 16-18" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CarRail({ cars }) {
  const dispatch = useDispatch();
  const wishlistIds = useSelector((s) => s.wishlist?.ids || []);
  const { requireAuth } = useAuthGuard();

  if (!cars.length) {
    return <p className="px-4 text-sm font-semibold text-slate-400">Cars will show here as soon as they are listed.</p>;
  }

  const saveCar = (event, carId) => {
    event.preventDefault();
    event.stopPropagation();
    requireAuth(() => dispatch(toggleWishlist(carId)));
  };

  return (
    <div className="flex gap-3.5 overflow-x-auto no-scrollbar pl-4 pr-4 py-1 pb-4 snap-x snap-mandatory scroll-pl-4">
      {cars.map((car) => {
        const saved = wishlistIds.includes(car._id);
        return (
          <article
            key={car._id}
            className="snap-start shrink-0 w-[68vw] max-w-[250px] bg-white rounded-2xl border border-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.08)] overflow-hidden"
          >
            <div className="relative h-[118px] bg-slate-100">
              <Link to={`/cars/${car._id}`} className="block h-full" aria-label={car.title}>
                {carImage(car) ? <img src={carImage(car)} alt="" className="w-full h-full object-cover" /> : null}
              </Link>
              {car.year ? (
                <span className="absolute top-2 left-2 bg-white text-[10px] font-black text-slate-900 px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                  {car.year}
                </span>
              ) : null}
              <button
                type="button"
                onClick={(event) => saveCar(event, car._id)}
                aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={saved}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-slate-100 shadow-md inline-flex items-center justify-center active:scale-95"
              >
                <Heart filled={saved} className={saved ? 'text-[#ff5a36]' : 'text-slate-700'} />
              </button>
            </div>
            <Link to={`/cars/${car._id}`} className="block p-2.5 active:bg-slate-50">
              <p className="text-[12px] font-bold text-slate-900 leading-snug line-clamp-1">{car.title}</p>
              <p className="text-[10px] font-semibold text-slate-600 mt-1 line-clamp-1">
                {[car.year, formatKm(car.kmDriven), car.fuel, car.transmission].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between gap-2">
                <p className="text-[14px] font-black text-slate-900 tracking-tight">{formatPrice(car.price)}</p>
                <p className="text-[9px] font-medium text-slate-500">EMI <strong className="font-bold text-[#3083ff]">{formatPrice(emi(car.price))}</strong></p>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function BannerCta({ href, children }) {
  const className = 'mt-3 inline-flex items-center h-10 px-4 rounded-full bg-white text-[#1853ff] text-[13px] font-black shadow-sm w-fit';
  if (/^https?:/i.test(href || '')) {
    return <a href={href} className={className}>{children}</a>;
  }
  return <Link to={href || '/cars'} className={className}>{children}</Link>;
}

function BannerSlide({ slide }) {
  return (
    <div className="relative h-[210px] w-full shrink-0 snap-start bg-slate-900">
      <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/72 to-slate-950/20" />
      <div className="relative flex h-full flex-col justify-center px-4">
        <p className="max-w-[15rem] text-[18px] font-semibold leading-snug text-white">{slide.title}</p>
        {slide.subtitle ? <p className="mt-1 max-w-[15rem] text-[13px] font-normal leading-snug text-white">{slide.subtitle}</p> : null}
        <BannerCta href={slide.href}>{slide.cta || 'Explore cars'} →</BannerCta>
      </div>
    </div>
  );
}

export default function MobileHome() {
  const navigate = useNavigate();
  const { brands } = useReferenceData();
  const userId = useSelector((s) => s.auth?.user?._id || s.auth?.user?.id || '');
  const isAuthed = useSelector((s) => Boolean(s.auth?.user && s.auth?.token));
  const [latest, setLatest] = useState([]);
  const [premium, setPremium] = useState([]);
  const [recent, setRecent] = useState([]);
  const [banners, setBanners] = useState(PROMO_BANNERS);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [budgetIndex, setBudgetIndex] = useState(0);
  const [budgetCars, setBudgetCars] = useState([]);
  const railRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/cars', { params: { sort: '-createdAt', limit: 8 } }).catch(() => ({ data: { cars: [] } })),
      api.get('/cars', { params: { minPrice: 1500000, limit: 8, sort: '-createdAt' } }).catch(() => ({ data: { cars: [] } })),
      api.get('/banners').catch(() => ({ data: [] })),
    ]).then(([l, p, b]) => {
      if (cancelled) return;
      setLatest(l.data?.cars || []);
      setPremium(p.data?.cars || []);
      const rows = Array.isArray(b.data) ? b.data : [];
      if (rows.length) {
        setBanners(rows.map((row) => ({
          id: row._id,
          image: mediaUrl(row.image),
          href: bannerHref(row),
          title: row.titleLine1 || row.title || 'Drive your dream car today',
          subtitle: row.subtitle || row.titleLine2 || '100% inspected | 1-year support',
          cta: row.ctaLabel || 'Explore cars',
        })));
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const id = setInterval(() => {
      setBannerIndex((current) => {
        const next = (current + 1) % banners.length;
        const rail = railRef.current;
        if (rail) {
          rail.scrollTo({ left: next * rail.clientWidth, behavior: 'smooth' });
        }
        return next;
      });
    }, 4200);
    return () => clearInterval(id);
  }, [banners.length]);

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

  useEffect(() => {
    const budget = HOME_BUDGETS[budgetIndex];
    let cancelled = false;
    api.get('/cars', { params: { ...budgetQuery(budget), limit: 8, sort: '-createdAt' } })
      .then((res) => { if (!cancelled) setBudgetCars(res.data?.cars || []); })
      .catch(() => { if (!cancelled) setBudgetCars([]); });
    return () => { cancelled = true; };
  }, [budgetIndex]);

  const onBannerScroll = () => {
    const rail = railRef.current;
    if (!rail || !rail.clientWidth) return;
    setBannerIndex(Math.max(0, Math.min(banners.length - 1, Math.round(rail.scrollLeft / rail.clientWidth))));
  };

  const showBanner = (index) => {
    const rail = railRef.current;
    if (rail) rail.scrollTo({ left: index * rail.clientWidth, behavior: 'smooth' });
    setBannerIndex(index);
  };

  const activeBudget = HOME_BUDGETS[budgetIndex];

  return (
    <div className="lg:hidden bg-[#f6f7fb] pb-28">
      <section className="px-4 pt-3">
        <div className="rounded-[22px] overflow-hidden shadow-sm">
          <div
            ref={railRef}
            onScroll={onBannerScroll}
            className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
          >
            {banners.map((slide) => <BannerSlide key={slide.id} slide={slide} />)}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {banners.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              onClick={() => showBanner(index)}
              className={`h-2 rounded-full transition-all ${index === bannerIndex ? 'w-5 bg-[#3083ff]' : 'w-2 bg-slate-300'}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 px-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-800 sm:text-lg">4tyrezz Provide Services</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {SERVICES.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative h-[132px] rounded-[22px] overflow-hidden bg-gradient-to-b ${item.tone} border border-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] active:scale-[0.98] transition-transform p-3 flex flex-col`}
            >
              {item.badge ? (
                <span className="absolute top-3 right-3 text-[9px] font-black tracking-wide text-white bg-[#ff5a36] px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              ) : null}
              <p className="whitespace-nowrap text-[13px] font-bold leading-none tracking-tight text-slate-900">{item.title}</p>
              <p className="text-[12px] font-medium text-slate-500 mt-1">{item.hint}</p>
              <span className="mt-auto flex justify-center overflow-hidden">
                <ServiceArt kind={item.art} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionHead title="Latest cars" href="/cars?sort=-createdAt" />
        <CarRail cars={latest} />
      </section>

      {recent.length > 0 && (
        <section className="mt-6">
          <SectionHead title="Continue looking" href="/cars" action="All cars" />
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
            {recent.slice(0, 8).map((car) => (
              <Link key={car.id} to={`/cars/${car.id}`} className="shrink-0 w-[168px] bg-white rounded-2xl overflow-hidden border border-slate-200/80 active:scale-[0.98]">
                <div className="h-[96px] bg-slate-100">
                  {car.thumb ? <img src={mediaUrl(car.thumb)} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="p-2.5">
                  <p className="text-[12px] font-semibold text-slate-900 line-clamp-1">{car.title}</p>
                  <p className="text-[12px] font-semibold text-[#1853ff] mt-0.5">{formatPrice(car.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <SectionHead
          title="Browse by budget"
          href={`/cars?${new URLSearchParams(budgetQuery(activeBudget)).toString()}`}
        />
        <div className="grid grid-cols-4 gap-2 px-4">
          {HOME_BUDGETS.map((budget, index) => {
            const active = index === budgetIndex;
            const Icon = budget.icon;
            return (
              <button
                key={budget.label}
                type="button"
                onClick={() => setBudgetIndex(index)}
                className={`min-w-0 h-[68px] rounded-xl border flex flex-col items-center justify-center gap-1 px-1 active:scale-95 transition-all ${
                  active
                    ? 'bg-[#3083ff] text-white border-[#3083ff] shadow-[0_6px_16px_rgba(48,131,255,0.35)]'
                    : `${GLASS} text-slate-800`
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#3083ff]'}`} strokeWidth={2.2} />
                <span className="text-[10px] font-bold leading-tight text-center whitespace-nowrap">{budget.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <CarRail cars={budgetCars} />
        </div>
      </section>

      <section className="mt-7 px-4">
        <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight mb-3">Browse by category</h2>
        <div className="space-y-4">
          {CATEGORIES.map((group) => (
            <div key={group.title}>
              <p className="text-[12px] font-semibold text-slate-700 mb-2">{group.title}</p>
              <div className="grid grid-cols-4 gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={`/cars?${group.param}=${encodeURIComponent(item.name)}`}
                      className="flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-white px-1 py-3 shadow-md shadow-slate-200/60 transition-all hover:-translate-y-1 active:scale-95"
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                      <span className="text-center text-[11px] font-semibold leading-tight text-slate-800">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionHead title="Popular brands" href="/brands" action="All brands" />
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4">
          {brands.slice(0, 12).map((b) => (
            <Link
              key={b._id}
              to={`/cars?brand=${b._id}`}
              className={`group ${GLASS} shrink-0 w-[96px] h-[108px] flex flex-col items-center justify-center gap-2 px-1 active:scale-95`}
            >
              {b.logo ? (
                <img src={mediaUrl(b.logo)} alt="" className="h-9 max-w-[60px] object-contain transition-transform group-hover:scale-105" />
              ) : (
                <span className="text-sm font-black text-[#1853ff] transition-transform group-hover:scale-105">{b.name.slice(0, 2).toUpperCase()}</span>
              )}
              <span className="text-xs font-bold text-slate-800 line-clamp-1">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionHead title="Premium picks" href="/cars?minPrice=1500000" />
        <p className="px-4 -mt-2 mb-3 text-[12px] font-semibold text-slate-500">Cars above ₹15 lakh</p>
        <CarRail cars={premium} />
      </section>

      <section className="mt-7 overflow-hidden rounded-t-3xl">
        <HowItWorks title="How does it work?" steps={WORK_STEPS} />
      </section>

      <section className="mt-7 px-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Why buyers start here</h2>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {WHY_START.map(({ icon: Icon, title, body, tone }) => (
            <div key={title} className="rounded-2xl bg-white px-2 py-3.5 text-center shadow-[0_8px_20px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
              <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              <p className="mt-2 text-[13px] font-semibold leading-tight text-slate-900">{title}</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="px-4 text-[15px] font-semibold tracking-tight text-slate-900">Reviews</h2>
        <div className="mt-3 flex gap-2.5 overflow-x-auto px-4 pb-3 snap-x">
          {DEFAULT_TESTIMONIALS.map((item) => (
            <article key={item.name} className="flex w-[240px] shrink-0 snap-start items-start gap-2.5 rounded-2xl bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
              <img src={item.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">{item.name}</p>
                <p className="text-[11px] font-semibold tracking-wide text-amber-500">★★★★★</p>
                <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-slate-600">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
