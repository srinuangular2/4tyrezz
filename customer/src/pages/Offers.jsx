import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, Scale, Tag, TicketPercent } from 'lucide-react';
import api from '../api/axios';
import CarCard from '../components/CarCard';
import DesignedPageBanner, { BannerActions, BannerButton } from '../components/DesignedPageBanner';
import { whatsappUrl } from '../lib/companyContact';
import { mediaUrl } from '../pages/profile/hubUtils';
import { formatPrice } from '../utils/format';
import {
  BRAND,
  Card,
  EmptyState,
  GhostButton,
  PrimaryButton,
  Section,
  Skeleton,
} from '../components/PageShell';

const TYPE_LABEL = {
  offer: 'Offer',
  campaign: 'Campaign',
  package: 'Package',
  boost: 'Boost',
  featured: 'Featured',
};

function daysLeft(endAt) {
  if (!endAt) return null;
  const ms = new Date(endAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
}

function priceHero(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return { big: `₹${(n / 10000000).toFixed(1)}`, unit: 'Cr' };
  if (n >= 100000) return { big: `₹${(n / 100000).toFixed(1)}`, unit: 'Lakh' };
  return { big: formatPrice(n), unit: '' };
}

function OfferBanner({ hero, unit, title, line, image, to, code, onCopy }) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[18px] font-bold leading-none tracking-tight text-slate-900 lg:text-[26px]">
          {hero}
          {unit ? <span className="ml-1 text-[11px] font-semibold text-slate-500 lg:text-[13px]">{unit}</span> : null}
        </p>
        <p className="mt-1 truncate text-[13px] font-semibold leading-tight text-slate-900 lg:mt-2 lg:text-[15px] lg:font-bold">{title}</p>
        <p className="mt-0.5 truncate text-[11px] font-normal leading-snug text-slate-500 lg:text-[12px]">{line}</p>
        {code ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onCopy(code);
            }}
            className="mt-2 text-[12px] font-semibold text-[#3083ff]"
          >
            Copy {code}
          </button>
        ) : null}
      </div>
      <img src={image} alt="" className="h-16 w-[88px] shrink-0 rounded-xl object-cover lg:h-[96px] lg:w-[120px] lg:rounded-2xl" />
    </>
  );
  const className = 'flex items-center gap-2.5 overflow-hidden rounded-2xl bg-[#f2f4f7] px-3 py-2 lg:gap-3 lg:rounded-[22px] lg:px-4 lg:py-3';
  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }
  return <article className={className}>{body}</article>;
}

export default function Offers() {
  const [promos, setPromos] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.allSettled([
      api.get('/promotions'),
      api.get('/cars', { params: { limit: 12, sort: 'price' } }),
    ])
      .then(([p, c]) => {
        if (p.status === 'fulfilled') setPromos(p.value.data.data || []);
        if (c.status === 'fulfilled') setDeals(c.value.data.cars || c.value.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(() => {
    const set = new Set(promos.map((p) => p.type).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [promos]);

  const visible = filter === 'all' ? promos : promos.filter((p) => p.type === filter);
  const spotlightCars = visible.length > 0 ? [] : deals.slice(0, 4);
  const gridCars = visible.length > 0 ? deals.slice(0, 8) : deals.slice(4, 12);

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Code ${code} copied`);
  };

  return (
    <div className="bg-slate-50">
      <DesignedPageBanner
        src="/offers.png"
        alt="Exclusive car offers on 4tyrezz"
        eyebrow="Offers & Deals"
        title="Exclusive 4tyrezz offers"
        accent="and deals"
        subtitle="Seasonal campaigns, price drops and finance packages on inspected inventory. Offers are published by our team and applied by the 4tyrezz desk."
        imageClass="object-[82%_bottom] sm:object-[right_bottom]"
      >
        <BannerActions>
          <BannerButton to="/cars">Browse all cars</BannerButton>
          <BannerButton to="/finance" ghost>Finance options</BannerButton>
          <BannerButton href={whatsappUrl('Hi 4tyrezz, I want to know about current car offers.')} ghost>
            Ask on WhatsApp
          </BannerButton>
        </BannerActions>
      </DesignedPageBanner>

      <section className="space-y-4 px-4 py-4 lg:hidden">
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <p className="text-[12px] font-medium text-[#3083ff]">How an offer works</p>
          <h2 className="mt-1 text-[18px] font-semibold text-slate-900">Three steps to the price</h2>
          <ol className="mt-3 space-y-3">
            {[
              ['1', 'Pick a live deal', 'Only offers published by 4tyrezz are listed here.'],
              ['2', 'Copy the code', 'If a code is shown, copy it. You will give it to the desk.'],
              ['3', 'Ask us to apply it', 'Enquire as usual. The desk adds the offer. A seller cannot.'],
            ].map(([n, title, body]) => (
              <li key={n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[12px] font-semibold text-[#1853ff]">{n}</span>
                <div>
                  <p className="text-[14px] font-semibold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <a href="#live-offers" className="mt-3 flex h-11 items-center justify-center rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white">
            See live offers
          </a>
        </div>
      </section>

      <Section eyebrow="How to save" title="Claim your offer" className="hidden lg:block">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            ['01', 'Pick a live deal', 'Seasonal campaigns and price drops published by 4tyrezz appear here first.'],
            ['02', 'Copy the code', 'If a promo code is listed, copy it and share it when our team calls you.'],
            ['03', 'Close with 4tyrezz', 'Enquire on the car as usual. Offers are applied by our desk — not by a dealer.'],
          ].map(([n, title, body]) => (
            <Card key={n} className="p-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#3083ff]">{n}</span>
              <h3 className="font-black text-slate-900 text-base mt-2">{title}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/cars">
            <PrimaryButton>Browse all cars</PrimaryButton>
          </Link>
          <Link to="/finance">
            <GhostButton>Finance options</GhostButton>
          </Link>
        </div>
      </Section>

      <Section id="live-offers" eyebrow="Live now" title="Special offers">
        {types.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  filter === t ? 'text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
                style={filter === t ? { backgroundColor: BRAND } : undefined}
              >
                {t === 'all' ? 'All' : TYPE_LABEL[t] || t}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <>
            <div className="space-y-3 lg:hidden">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
            <div className="hidden gap-5 lg:grid lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-52" />
              ))}
            </div>
          </>
        ) : visible.length > 0 ? (
          <>
          <div className="grid gap-3 lg:grid-cols-2">
            {visible.map((p) => {
              const left = daysLeft(p.endAt);
              const vehicle = p.vehicle && typeof p.vehicle === 'object' ? p.vehicle : null;
              const image = mediaUrl(vehicle?.images?.[0]) || '/offers.png';
              const line = p.description || (left == null ? 'Ask the desk to apply this offer.' : left === 0 ? 'Ends today.' : `${left} day${left === 1 ? '' : 's'} left.`);
              return (
                <OfferBanner
                  key={p._id}
                  hero={p.discountPercent != null ? `${p.discountPercent}%` : TYPE_LABEL[p.type] || 'Offer'}
                  title={p.title}
                  line={line}
                  image={image}
                  to={vehicle?._id ? `/cars/${vehicle._id}` : undefined}
                  code={p.code}
                  onCopy={copyCode}
                />
              );
            })}
          </div>
          </>
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {spotlightCars.length === 0 && (
                <EmptyState
                  icon={TicketPercent}
                  title="No live promotions right now"
                  body="Campaigns are published by the 4tyrezz team and appear here automatically. In the meantime, the best-value cars in our inventory are listed below."
                  action={
                    <Link to="/cars">
                      <PrimaryButton>Browse inspected cars</PrimaryButton>
                    </Link>
                  }
                />
              )}
              {spotlightCars.map((car) => {
                const hero = priceHero(car.price);
                return (
                  <OfferBanner
                    key={car._id}
                    hero={hero.big}
                    unit={hero.unit}
                    title={car.title}
                    line={[car.fuel, car.transmission].filter(Boolean).join(' · ') || 'Inspected car with a clear price.'}
                    image={mediaUrl(car.images?.[0]) || '/offers.png'}
                    to={`/cars/${car._id}`}
                  />
                );
              })}
            </div>
          </>
        )}
      </Section>

      <Section eyebrow="Always on" title="Best value in our inventory" bg viewAllHref="/cars?sort=price">
        <p className="mb-3 text-[13px] font-normal leading-snug text-slate-500 lg:hidden">Open a car to see kilometres, fuel and the monthly EMI.</p>
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 lg:h-72" />
            ))}
          </div>
        ) : deals.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-5">
            {gridCars.map((c) => (
              <CarCard key={c._id} car={c} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">New inspected stock is added weekly.</p>
          </Card>
        )}
      </Section>

      <section className="px-4 pb-2 lg:hidden">
        <h2 className="text-[17px] font-semibold text-slate-900">On every car</h2>
        <ul className="mt-3 space-y-2">
          {[
            [BadgeCheck, 'Inspected', 'Engine, tyres, electricals and odometer are checked before a car goes live.'],
            [Scale, 'Clear price', 'Each listing shows a market range, so you can see if the price is fair.'],
            [Tag, 'One desk', 'Loan and insurance paperwork is handled with the purchase.'],
          ].map(([Icon, title, body]) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#1853ff]">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Section eyebrow="Standing benefits" title="What every 4tyrezz buyer gets" className="hidden lg:block">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            ['15-point inspection', 'Every listed car is manually inspected before it goes live — engine, tyres, electricals, chassis and odometer.'],
            ['Transparent pricing', 'Market price range shown on each listing, so you know whether a car is priced fairly before you enquire.'],
            ['Finance & insurance desk', 'One team handles your loan and policy paperwork alongside the purchase.'],
          ].map(([title, body]) => (
            <Card key={title} className="p-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" strokeWidth={2.25} />
              </div>
              <h3 className="font-black text-slate-900 text-sm mt-4">{title}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div className="h-20 lg:hidden" />
      <div className="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-40 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-3 py-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] lg:hidden">
        <Link to="/cars" className="flex h-11 items-center justify-center rounded-full bg-[#e8f1ff] text-[14px] font-semibold text-[#3083ff]">
          Browse cars
        </Link>
        <a
          href={whatsappUrl('Hi 4tyrezz, I want to know about current car offers.')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center rounded-full bg-[#3083ff] text-[14px] font-semibold text-white"
        >
          Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
