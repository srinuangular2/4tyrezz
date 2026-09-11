import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Search, Star, Store } from 'lucide-react';
import api from '../api/axios';
import CarCard from '../components/CarCard';
import {
  BRAND,
  Card,
  EmptyState,
  PageHero,
  PrimaryButton,
  Section,
  Skeleton,
  inputClass,
} from '../components/PageShell';

export function DealersList() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    api
      .get('/dealers', { params: { limit: 48 } })
      .then((r) => setDealers(r.data.data || []))
      .catch(() => setDealers([]))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(dealers.map((d) => d.city).filter(Boolean))).sort(),
    [dealers]
  );

  const visible = dealers.filter(
    (d) =>
      (!city || d.city === city) &&
      (!query || d.name?.toLowerCase().includes(query.toLowerCase()))
  );

  const totalInventory = dealers.reduce((sum, d) => sum + (Number(d.inventory) || 0), 0);

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Verified Partners"
        title="Our dealer network"
        subtitle="Every partner showroom is verified before onboarding, and their live inventory is inspected to the same 15-point standard."
      >
        <div className="flex flex-wrap gap-6 mt-8">
          <Stat value={dealers.length || '—'} label="Verified dealers" />
          <Stat value={totalInventory || '—'} label="Cars listed" />
          <Stat value={cities.length || '—'} label="Cities covered" />
        </div>
      </PageHero>

      <Section eyebrow="Browse" title="Find a showroom near you">
        <div className="grid sm:grid-cols-[1fr_220px] gap-4 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Search dealer name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className={inputClass} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((d) => (
              <Link key={d.id} to={`/dealers/${d.id}`} className="group">
                <Card className="p-5 h-full flex flex-col hover:border-[#3083ff]/50 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {d.badge || 'Verified Dealer'}
                    </span>
                    {d.rating != null && (
                      <span className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {d.rating}
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-slate-900 text-base mt-4 leading-snug">{d.name}</h3>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {d.city || 'Location on request'}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-black text-slate-600">{d.inventory || 0} vehicles</span>
                    <span
                      className="font-black group-hover:translate-x-0.5 transition-transform"
                      style={{ color: BRAND }}
                    >
                      View showroom →
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title={dealers.length ? 'No dealers match that search' : 'No dealers onboarded yet'}
            body={
              dealers.length
                ? 'Try a different name or clear the city filter.'
                : 'Partner showrooms appear here as soon as they are verified by our operations team.'
            }
            action={
              <Link to="/cars">
                <PrimaryButton>Browse all cars</PrimaryButton>
              </Link>
            }
          />
        )}
      </Section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="font-black text-white text-2xl sm:text-3xl tracking-tight">{value}</div>
      <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export function DealerProfile() {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/dealers/${id}`)
      .then((r) => setDealer(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'This dealer could not be found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-5">
          <Skeleton className="h-40" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dealer) {
    return (
      <div className="bg-slate-50">
        <PageHero eyebrow="Dealer" title="Showroom not found" subtitle={error} />
        <Section>
          <EmptyState
            icon={Store}
            title="We couldn't load this dealer"
            body="The showroom may have been removed or is no longer active on 4tyrezz."
            action={
              <Link to="/dealers">
                <PrimaryButton>Back to all dealers</PrimaryButton>
              </Link>
            }
          />
        </Section>
      </div>
    );
  }

  const cars = dealer.cars || [];
  const reviews = Array.isArray(dealer.reviews) ? dealer.reviews : [];

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow={dealer.verified ? 'Verified Dealer' : dealer.badge || 'Partner'}
        title={dealer.name}
        subtitle={dealer.about || `Live inspected inventory from ${dealer.name}${dealer.city ? ` in ${dealer.city}` : ''}.`}
      >
        <div className="flex flex-wrap gap-6 mt-8">
          <Stat value={cars.length} label="Active inventory" />
          {dealer.rating != null && <Stat value={`${dealer.rating}★`} label="Average rating" />}
          {dealer.reviewCount != null && <Stat value={dealer.reviewCount} label="Reviews" />}
          {dealer.city && <Stat value={dealer.city} label="Location" />}
        </div>
      </PageHero>

      <Section eyebrow="Showroom" title="Visit & hours">
        <Card className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Address</p>
            <p className="font-bold text-slate-800 mt-1">{dealer.address || dealer.city || 'Location on request'}</p>
            {dealer.geo?.lat != null && dealer.geo?.lng != null && (
              <a
                className="inline-block mt-3 text-sm font-black text-[#3083ff]"
                href={`https://www.google.com/maps?q=${dealer.geo.lat},${dealer.geo.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open map
              </a>
            )}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Operating hours</p>
            {dealer.operatingHours && Object.keys(dealer.operatingHours).length ? (
              <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-600">
                {Object.entries(dealer.operatingHours).map(([day, hours]) => (
                  <li key={day} className="flex justify-between gap-4"><span>{day}</span><span>{hours || '—'}</span></li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-slate-500 mt-2">Hours will appear after the dealer publishes them.</p>
            )}
          </div>
        </Card>
      </Section>

      <Section eyebrow="Inventory" title="Cars from this showroom" viewAllHref="/cars">
        {cars.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((c) => (
              <CarCard key={c._id} car={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title="No public inventory right now"
            body="This dealer has no live listings at the moment. New stock is published as soon as it clears inspection."
            action={
              <Link to="/cars">
                <PrimaryButton>Browse other listings</PrimaryButton>
              </Link>
            }
          />
        )}
      </Section>

      {reviews.length > 0 && (
        <Section eyebrow="Reviews" title="What buyers say" bg>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <Card key={r._id} className="p-5">
                <div className="flex gap-0.5 text-amber-500 text-xs">{'★'.repeat(r.rating || 5)}</div>
                <p className="text-sm font-medium text-slate-600 mt-3 leading-relaxed">{r.comment}</p>
                <p className="text-xs font-black text-slate-900 mt-4">{r.user?.name || 'Verified buyer'}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
