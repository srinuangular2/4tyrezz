import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import CarCard from '../components/CarCard';
import { CarGridSkeleton } from '../components/Skeletons';
import HeroCarousel from '../components/HeroCarousel';

const BUDGETS = [
  { label: 'Under ₹3 Lakh', max: 300000 },
  { label: '₹3 – 5 Lakh', min: 300000, max: 500000 },
  { label: '₹5 – 10 Lakh', min: 500000, max: 1000000 },
  { label: '₹10 – 20 Lakh', min: 1000000, max: 2000000 },
  { label: 'Above ₹20 Lakh', min: 2000000 },
];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV'];

const TESTIMONIALS = [
  { name: 'Ananya R.', city: 'Hyderabad', text: 'The inspection report gave me real confidence — found a Nexon with zero surprises.' },
  { name: 'Vikram S.', city: 'Bengaluru', text: 'Sold my old Swift in 4 days through the C2B route. Dealers bid on it directly.' },
  { name: 'Priya M.', city: 'Chennai', text: 'Loved that the inspection score was right on the listing, not buried in a PDF.' },
];
const FAQS = [
  { q: 'How does the inspection work?', a: 'Every car is checked across 15 points — engine, tyres, electricals, body and odometer — by a 4tyrezz inspector before it can be listed.' },
  { q: 'Can I sell my car directly to a buyer?', a: 'Yes — list it yourself (C2C), or post it once and let our dealer network bid on it (C2B).' },
  { q: 'Is the OTP login secure?', a: 'Yes, login is mobile number + one-time password only — no passwords to remember or leak.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { brands, cities } = useReferenceData();
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [premium, setPremium] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState({ city: '', budget: '', fuel: '' });

  useEffect(() => {
    Promise.all([
      api.get('/cars', { params: { isFeatured: true, limit: 4 } }),
      api.get('/cars', { params: { sort: '-createdAt', limit: 8 } }),
      api.get('/cars', { params: { isPremium: true, limit: 4 } }),
    ]).then(([f, l, p]) => {
      setFeatured(f.data.cars);
      setLatest(l.data.cars);
      setPremium(p.data.cars);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.city) params.set('city', q.city);
    if (q.fuel) params.set('fuel', q.fuel);
    if (q.budget) {
      const b = BUDGETS[q.budget];
      if (b.min) params.set('minPrice', b.min);
      if (b.max) params.set('maxPrice', b.max);
    }
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <>
      {/* ---- Hero ---- */}
      <HeroCarousel />

      <section className="container-px pt-6">
        <form onSubmit={search} className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select value={q.city} onChange={(e) => setQ({ ...q, city: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-3 text-sm">
            <option value="">Any city</option>
            {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={q.budget} onChange={(e) => setQ({ ...q, budget: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-3 text-sm">
            <option value="">Any budget</option>
            {BUDGETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
          </select>
          <select value={q.fuel} onChange={(e) => setQ({ ...q, fuel: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-3 text-sm">
            <option value="">Any fuel type</option>
            {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
          </select>
          <button className="bg-red-gradient hover:opacity-90 text-white font-display font-bold rounded-lg py-3 transition">Search cars</button>
        </form>
        <div className="flex flex-wrap gap-5 mt-5 pb-2">
          {['15-point manual inspection', 'Verified dealers only', 'Book inspection before you pay', 'Chat directly with the seller'].map((t) => (
            <span key={t} className="flex items-center gap-2 text-xs font-semibold text-slate2">
              <span className="w-2 h-2 rounded-full bg-verify" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ---- Stat strip ---- */}
      <div className="bg-white border-b border-slate-100 grid grid-cols-2 md:grid-cols-4">
        {[['1,200+', 'Cars inspected'], ['40+', 'Verified dealers'], ['18', 'Cities live'], ['91%', 'Avg. inspection score']].map(([n, l], i) => (
          <div key={l} className={`text-center py-7 ${i < 3 ? 'border-r border-slate-100' : ''}`}>
            <div className="font-display font-black text-3xl text-ink">{n}</div>
            <div className="text-xs font-semibold text-slate2 mt-1">{l}</div>
          </div>
        ))}
      </div>

      <Section eyebrow="Fresh on the lot" title="Featured Cars" viewAllHref="/cars?isFeatured=true">
        {loading ? <CarGridSkeleton /> : <Grid cars={featured} />}
      </Section>

      <Section eyebrow="Shop by brand" title="Popular Brands" bg>
        <div className="flex flex-wrap gap-3">
          {brands.filter((b) => b.isPopular).map((b) => (
            <Link key={b._id} to={`/cars?brand=${b._id}`} className="bg-white border border-slate-200 rounded-xl px-6 py-3 font-display font-bold text-ink hover:border-ember hover:text-ember transition">
              {b.name}
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="Just listed" title="Latest Cars" viewAllHref="/cars?sort=-createdAt">
        {loading ? <CarGridSkeleton /> : <Grid cars={(latest || []).slice(0, 4)} />}
      </Section>

      <Section eyebrow="Top picks" title="Premium Cars" bg viewAllHref="/cars?isPremium=true">
        {loading ? <CarGridSkeleton /> : <Grid cars={premium} />}
      </Section>

      <Section eyebrow="Explore" title="Browse by budget, fuel & body type">
        <div className="grid md:grid-cols-3 gap-6">
          <BrowseCard title="By Budget" items={BUDGETS.map((b) => b.label)} onClick={(i) => {
            const b = BUDGETS[i]; const p = new URLSearchParams();
            if (b.min) p.set('minPrice', b.min); if (b.max) p.set('maxPrice', b.max);
            navigate(`/cars?${p}`);
          }} />
          <BrowseCard title="By Fuel Type" items={FUEL_TYPES} onClick={(i) => navigate(`/cars?fuel=${FUEL_TYPES[i]}`)} />
          <BrowseCard title="By Body Type" items={BODY_TYPES} onClick={(i) => navigate(`/cars?bodyType=${BODY_TYPES[i]}`)} />
        </div>
      </Section>

      <Section eyebrow="Why 4tyrezz" title="What 'inspected' actually means" bg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden">
          {[
            ['01', 'Booking', "Buyer or seller books a slot; inspector confirms a time and location."],
            ['02', '15-point checklist', 'Engine, tyres, electricals, body and odometer are checked and photographed.'],
            ['03', 'Scoring', 'Every car gets a score out of 100 — shown right on the listing.'],
            ['04', 'Signed report', 'A downloadable inspection report is attached for both sides.'],
          ].map(([n, t, d]) => (
            <div key={n} className="bg-white p-6">
              <div className="font-display font-black text-2xl text-ember">{n}</div>
              <h4 className="font-semibold mt-2">{t}</h4>
              <p className="text-sm text-slate2 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Testimonials" title="What buyers & sellers say">
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-soft">
              <p className="text-sm text-slate2">&ldquo;{t.text}&rdquo;</p>
              <p className="text-sm font-semibold mt-4">{t.name} <span className="text-slate2 font-normal">· {t.city}</span></p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQs" title="Common questions" bg>
        <div className="max-w-2xl space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="bg-white border border-slate-100 rounded-xl p-5 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <span className="text-ember group-open:rotate-45 transition">+</span>
              </summary>
              <p className="text-sm text-slate2 mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <div className="container-px pb-16">
        <div className="bg-ember rounded-2xl p-10 md:p-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="font-display font-black text-white text-3xl">Have a car to sell?</h2>
            <p className="text-white/85 mt-1">List it in minutes — set your price, add photos, and we'll help you find a verified buyer.</p>
          </div>
          <Link to="/dashboard/add-car" className="bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-lg whitespace-nowrap">
            List your car →
          </Link>
        </div>
      </div>
    </>
  );
}

function Section({ eyebrow, title, children, bg, viewAllHref }) {
  return (
    <section className={bg ? 'bg-white py-14' : 'py-14'}>
      <div className="container-px">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-ember font-display font-bold uppercase tracking-widest text-xs">{eyebrow}</p>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">{title}</h2>
          </div>
          {viewAllHref && <Link to={viewAllHref} className="text-ember font-semibold text-sm whitespace-nowrap">View all →</Link>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Grid({ cars }) {
  if (!cars?.length) return <p className="text-slate2 text-sm">Nothing here yet.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cars.map((c) => <CarCard key={c._id} car={c} />)}
    </div>
  );
}

function BrowseCard({ title, items, onClick }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-soft">
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <button key={item} onClick={() => onClick(i)} className="text-left text-sm text-slate2 hover:text-ember py-1.5 border-b border-slate-50 last:border-0">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
