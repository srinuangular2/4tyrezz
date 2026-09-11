import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, Tag, TicketPercent } from 'lucide-react';
import api from '../api/axios';
import CarCard from '../components/CarCard';
import {
  BRAND,
  Card,
  EmptyState,
  GhostButton,
  PageHero,
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

export default function Offers() {
  const [promos, setPromos] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.allSettled([
      api.get('/promotions'),
      api.get('/cars', { params: { limit: 8, sort: 'price' } }),
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

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Code ${code} copied`);
  };

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Offers & Deals"
        title="Exclusive 4tyrezz offers and deals"
        subtitle="Seasonal campaigns, dealer packages and price drops across our inspected inventory. Offers are published by our team and refresh regularly."
      >
        <div className="flex flex-wrap gap-3 mt-6">
          <Link to="/cars">
            <PrimaryButton>Browse all cars</PrimaryButton>
          </Link>
          <Link to="/finance">
            <GhostButton>Finance options</GhostButton>
          </Link>
        </div>
      </PageHero>

      <Section eyebrow="Live now" title="Current promotions">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((p) => {
              const left = daysLeft(p.endAt);
              return (
                <Card key={p._id} className="p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {TYPE_LABEL[p.type] || p.type}
                    </span>
                    {p.discountPercent != null && (
                      <span
                        className="text-xs font-black px-2.5 py-1 rounded-md text-white"
                        style={{ backgroundColor: BRAND }}
                      >
                        {p.discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-slate-900 text-lg mt-4 leading-snug">{p.title}</h3>
                  {p.description && (
                    <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">{p.description}</p>
                  )}

                  <div className="mt-auto pt-5 space-y-3">
                    {p.code && (
                      <button
                        type="button"
                        onClick={() => copyCode(p.code)}
                        className="w-full flex items-center justify-between gap-2 border-2 border-dashed border-slate-300 rounded-xl px-4 py-3 hover:border-slate-400 transition group"
                      >
                        <span className="font-black text-sm tracking-widest text-slate-900">{p.code}</span>
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-500 group-hover:text-slate-700">
                          <Copy className="w-3.5 h-3.5" strokeWidth={2.5} /> Copy
                        </span>
                      </button>
                    )}
                    {left != null && (
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {left === 0 ? 'Ends today' : `${left} day${left === 1 ? '' : 's'} left`}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
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
      </Section>

      <Section eyebrow="Always on" title="Best value in our inventory" bg viewAllHref="/cars?sort=price">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : deals.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {deals.slice(0, 8).map((c) => (
              <CarCard key={c._id} car={c} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">New inspected stock is added weekly.</p>
          </Card>
        )}
      </Section>

      <Section eyebrow="Standing benefits" title="What every 4tyrezz buyer gets">
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
    </div>
  );
}
