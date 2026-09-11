import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Check, Plus, ShieldCheck, X } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import api from '../api/axios';
import { BRAND, GhostButton, PageHero, PrimaryButton, Section, Skeleton, formatINR } from '../components/PageShell';

const MAX = 4;

const dash = (v) => (v == null || v === '' ? '—' : v);

const GROUPS = [
  {
    key: 'price',
    label: 'Price',
    rows: [
      ['Listed price', (c) => formatINR(c.price), 'min'],
      ['Market band', (c) => (c.marketPriceMin && c.marketPriceMax ? `${formatINR(c.marketPriceMin)} – ${formatINR(c.marketPriceMax)}` : '—')],
    ],
  },
  {
    key: 'year',
    label: 'Year',
    rows: [
      ['Year', (c) => c.year ?? '—', 'max'],
      ['Registration year', (c) => c.registrationYear ?? '—'],
    ],
  },
  {
    key: 'km',
    label: 'KM',
    rows: [
      ['Kilometres', (c) => (c.kmDriven != null ? `${Number(c.kmDriven).toLocaleString('en-IN')} km` : '—'), 'min'],
    ],
  },
  {
    key: 'fuel',
    label: 'Fuel',
    rows: [['Fuel', (c) => c.fuel || '—']],
  },
  {
    key: 'transmission',
    label: 'Transmission',
    rows: [['Transmission', (c) => c.transmission || '—']],
  },
  {
    key: 'engine',
    label: 'Engine / specifications',
    rows: [
      ['Engine', (c) => (c.engineDisplacement ? `${c.engineDisplacement} cc` : '—')],
      ['Variant', (c) => c.variant || '—'],
      ['Body', (c) => c.bodyType || '—'],
      ['Seats', (c) => c.seats ?? '—', 'max'],
      ['Colour', (c) => c.color || '—'],
    ],
  },
  {
    key: 'owners',
    label: 'Owners',
    rows: [
      ['Owners', (c) => (c.ownership ? `${c.ownership}${c.ownership === 1 ? 'st' : c.ownership === 2 ? 'nd' : 'th'} owner` : '—'), 'min'],
    ],
  },
  {
    key: 'mileage',
    label: 'Mileage',
    rows: [
      ['Claimed mileage', (c) => c.claimedMileage || '—'],
      ['Usage condition', (c) => c.condition?.kmCondition || '—'],
    ],
  },
  {
    key: 'safety',
    label: 'Safety / features',
    rows: [
      ['Safety kit', (c) => (c.safetyFeatures?.length ? c.safetyFeatures.slice(0, 4).join(', ') : '—')],
      ['Airbags / ABS listed', (c) => (c.safetyFeatures?.length ? `${c.safetyFeatures.length} items` : '—'), 'max'],
      ['Other features', (c) => (c.features?.length ? c.features.slice(0, 5).join(', ') : '—')],
    ],
  },
  {
    key: 'warranty',
    label: 'Warranty / inspection',
    rows: [
      ['Inspection score', (c) => (c.inspectionScore != null ? `${c.inspectionScore}/100` : '—'), 'max'],
      ['Inspection report', (c) => c.warranty?.inspectionReport || '—'],
      ['Insurance', (c) => c.warranty?.insuranceType || c.insuranceType || '—'],
      ['Insurance valid till', (c) => c.warranty?.insuranceExpiry || '—'],
      ['PUC valid till', (c) => c.warranty?.pucExpiry || '—'],
      ['Fitness valid till', (c) => c.warranty?.fitnessValidUpto || '—'],
      ['Accidental', (c) => c.warranty?.accidental || c.condition?.accidental || '—'],
      ['Service history', (c) => c.warranty?.serviceHistory || '—'],
    ],
  },
  {
    key: 'dealer',
    label: 'Dealer information',
    rows: [
      [
        'Dealer',
        (c) =>
          c.dealer?.id ? (
            <Link to={`/dealers/${c.dealer.id}`} className="text-[#3083ff] hover:underline">
              {c.dealer.name || 'View dealer'}
            </Link>
          ) : (
            dash(c.dealer?.name)
          ),
      ],
      ['City', (c) => c.dealer?.city || c.city || '—'],
      ['Seller type', (c) => (c.dealer?.sellerType === 'dealer' ? 'Dealer' : c.dealer?.sellerType === 'individual' ? 'Individual' : '—')],
    ],
  },
  {
    key: 'emi',
    label: 'Estimated EMI',
    rows: [
      ['EMI (10.5% · 20% down · 60 mo)', (c) => (c.estimatedEmi ? `${formatINR(c.estimatedEmi)}/mo` : '—'), 'min'],
    ],
  },
];

function shortName(c) {
  return c.model || c.title?.split(' ').slice(-2).join(' ') || 'Car';
}

function numericFor(c, fn) {
  const raw = fn(c);
  if (raw == null || typeof raw === 'object') return null;
  if (typeof raw === 'number') return raw;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function winners(cars, fn, mode) {
  if (!mode || cars.length < 2) return new Set();
  const vals = cars.map((c) => numericFor(c, fn));
  const usable = vals.filter((v) => v != null);
  if (!usable.length) return new Set();
  const target = mode === 'min' ? Math.min(...usable) : Math.max(...usable);
  return new Set(cars.filter((_, i) => vals[i] === target).map((c) => c.id));
}

export default function Compare() {
  const { user } = useSelector((s) => s.auth);
  const [params, setParams] = useSearchParams();
  const idsParam = params.get('ids') || '';
  const ids = useMemo(() => idsParam.split(',').map((s) => s.trim()).filter(Boolean), [idsParam]);

  const [cars, setCars] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    api
      .get('/compare/suggested')
      .then((r) => setPairs(r.data.data || []))
      .catch(() => setPairs([]))
      .finally(() => setPairsLoading(false));
  }, []);

  useEffect(() => {
    if (!ids.length) {
      setCars([]);
      return;
    }
    setLoading(true);
    api
      .get('/compare', { params: { ids: ids.join(',') } })
      .then((r) => setCars(r.data.data || []))
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, [idsParam]);

  const setIds = (next) => {
    if (next.length === 0) setParams({});
    else setParams({ ids: next.join(',') });
  };

  const addCar = (id) => {
    if (ids.includes(id) || ids.length >= MAX) return;
    setIds([...ids, id]);
  };

  const removeCar = (id) => setIds(ids.filter((x) => x !== id));
  const slots = [...cars, ...Array.from({ length: Math.max(0, MAX - cars.length) }, () => null)].slice(0, MAX);

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Garage matchup"
        title="Compare inspected cars"
        subtitle="Pick a live pairing or build your own bench of up to four verified listings — price, year, kilometres, fuel, transmission, engine, owners, mileage, safety, warranty, dealer and estimated EMI in one matrix."
      >
        <div className="flex flex-wrap gap-3 mt-6">
          <PrimaryButton onClick={() => setPickerOpen(true)}>
            {ids.length ? 'Add another listing' : 'Build a matchup'}
          </PrimaryButton>
          {ids.length > 0 && <GhostButton onClick={() => setIds([])}>Reset bench</GhostButton>}
          {user?.role === 'customer' && ids.length >= 2 && (
            <GhostButton
              onClick={async () => {
                try {
                  await api.post('/user/comparisons', {
                    vehicles: ids,
                    name: cars.map((c) => c.title).filter(Boolean).join(' vs ') || 'Comparison',
                  });
                  toast.success('Comparison saved to your account');
                } catch (e) {
                  toast.error(e.response?.data?.message || 'Could not save comparison');
                }
              }}
            >
              Save to My Account
            </GhostButton>
          )}
        </div>
      </PageHero>

      {ids.length === 0 && (
        <Section
          eyebrow="Live pairings"
          title={<>Compare to buy the <span className="font-black">right car</span></>}
          className="bg-gradient-to-b from-blue-50/70"
        >
          {pairsLoading ? (
            <div className="grid md:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : pairs.length === 0 ? (
            <div className="rounded-3xl bg-white/50 backdrop-blur-xl border border-white/70 p-10 text-center">
              <p className="font-black text-slate-900">No pairings yet</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Listings appear here as soon as two approved cars are live.</p>
              <PrimaryButton className="mt-5" onClick={() => setPickerOpen(true)}>Build a matchup</PrimaryButton>
            </div>
          ) : (
            <div className="relative px-2">
              <button
                ref={prevRef}
                aria-label="Previous pairings"
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center font-black text-slate-700 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition"
              >
                ‹
              </button>
              <button
                ref={nextRef}
                aria-label="Next pairings"
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center font-black text-slate-700 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition"
              >
                ›
              </button>
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                onBeforeInit={(swiper) => {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                }}
                navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
                breakpoints={{ 768: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }}
                className="!py-2"
              >
                {pairs.map((pair) => (
                  <SwiperSlide key={pair.id} className="h-auto">
                    <VsCard pair={pair} onOpen={() => setIds(pair.ids)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </Section>
      )}

      <Section
        eyebrow={ids.length ? 'Your bench' : 'Custom bench'}
        title={ids.length >= 2 ? 'Head-to-head matrix' : 'Line up to four cars'}
      >
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {slots.map((c, i) =>
                c ? (
                  <div
                    key={c.id}
                    className="relative rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] p-4 overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-[#3083ff] to-indigo-500" />
                    <button
                      type="button"
                      onClick={() => removeCar(c.id)}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                      aria-label={`Remove ${c.title}`}
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff] mb-2">Slot {i + 1}</p>
                    <img src={c.images?.[0] || '/pwa-192.png'} alt="" className="w-full h-32 object-cover rounded-2xl bg-slate-100" />
                    <p className="text-[11px] font-bold text-slate-400 mt-3">{c.brand || '—'}</p>
                    <Link to={`/cars/${c.id}`} className="font-black text-slate-900 text-sm leading-snug hover:text-[#3083ff] line-clamp-2">
                      {c.model || c.title}
                    </Link>
                    <p className="font-black text-[#3083ff] mt-1">{formatINR(c.price)}</p>
                    {c.estimatedEmi ? (
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">EMI {formatINR(c.estimatedEmi)}/mo</p>
                    ) : null}
                  </div>
                ) : (
                  <button
                    key={`empty-${i}`}
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="rounded-3xl border-2 border-dashed border-slate-300 min-h-[220px] flex flex-col items-center justify-center gap-2 hover:border-[#3083ff] hover:bg-white/70 transition"
                  >
                    <span className="w-11 h-11 rounded-2xl bg-blue-50 text-[#3083ff] flex items-center justify-center">
                      <Plus className="w-5 h-5" strokeWidth={2.5} />
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Add car {i + 1}</span>
                  </button>
                )
              )}
            </div>

            {cars.length === 1 && (
              <p className="text-sm font-semibold text-slate-500 mb-4">Add a second listing to unlock the matrix. You can compare up to four cars.</p>
            )}

            {cars.length >= 2 && <CompareMatrix cars={cars} />}
          </>
        )}
      </Section>

      {pickerOpen && (
        <CarPicker selectedIds={ids} max={MAX} onAdd={addCar} onRemove={removeCar} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

function VsCard({ pair, onOpen }) {
  const [a, b] = pair.cars;
  return (
    <article className="h-full flex flex-col rounded-3xl bg-white/45 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_0_rgba(48,131,255,0.16)] transition-all duration-300">
      <div className="relative bg-gradient-to-b from-slate-100/80 to-white px-4 pt-6 pb-4">
        <div className="grid grid-cols-2 gap-2 items-end">
          <img src={a.images?.[0]} alt={a.title} className="h-24 sm:h-28 w-full object-contain" />
          <img src={b.images?.[0]} alt={b.title} className="h-24 sm:h-28 w-full object-contain" />
        </div>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#3083ff] text-white text-[11px] font-black flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white">
          VS
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 pt-2 pb-4">
        {[a, b].map((c) => (
          <div key={c.id}>
            <p className="text-[11px] font-bold text-slate-400 truncate">{c.brand}</p>
            <p className="font-black text-slate-900 text-sm truncate">{shortName(c)}</p>
            <p className="text-xs font-extrabold text-slate-700 mt-0.5">{formatINR(c.price)}</p>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5 mt-auto">
        <button
          type="button"
          onClick={onOpen}
          className="w-full rounded-xl border-2 border-[#3083ff] text-[#3083ff] font-black text-xs uppercase tracking-wider py-2.5 hover:bg-[#3083ff] hover:text-white transition"
        >
          {shortName(a)} vs {shortName(b)}
        </button>
      </div>
    </article>
  );
}

function CompareMatrix({ cars }) {
  return (
    <div className="space-y-5">
      {GROUPS.map((group) => (
        <div key={group.key} className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
          <div className="px-5 py-3 bg-slate-900 text-white flex items-center gap-2">
            {group.key === 'safety' && <ShieldCheck className="w-4 h-4 text-[#6BA6FF]" />}
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">{group.label}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-4 w-40" />
                  {cars.map((c) => (
                    <th key={c.id} className="p-4 text-left font-black text-slate-900">
                      {shortName(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.rows.map(([label, fn, mode], idx) => {
                  const win = winners(cars, fn, mode);
                  return (
                    <tr key={label} className={idx % 2 ? 'bg-blue-50/40' : ''}>
                      <th className="p-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500 align-top">
                        {label}
                      </th>
                      {cars.map((c) => (
                        <td key={c.id + label} className="p-4 font-extrabold text-slate-800 align-top">
                          <span className={win.has(c.id) ? 'text-[#3083ff]' : ''}>{fn(c)}</span>
                          {win.has(c.id) && cars.filter((x) => win.has(x.id)).length === 1 && (
                            <span className="ml-2 text-[9px] font-black uppercase tracking-wider text-white bg-[#3083ff] px-1.5 py-0.5 rounded-md">
                              Edge
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cars.map((c) => (
          <Link key={c.id} to={`/cars/${c.id}`}>
            <PrimaryButton className="w-full">View {shortName(c)}</PrimaryButton>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CarPicker({ selectedIds, max, onAdd, onRemove, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get('/cars', { params: { search: query || undefined, limit: 24 } })
        .then((r) => setResults(r.data.cars || r.data.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Add to bench</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedIds.length} of {max}</p>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand, model or title…"
            className="w-full mt-4 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-extrabold focus:outline-none focus:border-[#3083ff] focus:ring-1 focus:ring-[#3083ff]"
          />
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          {!loading && results.length === 0 && (
            <p className="text-sm font-semibold text-slate-500 text-center py-10">No cars matched that search.</p>
          )}
          {!loading &&
            results.map((c) => {
              const id = String(c._id || c.id);
              const picked = selectedIds.includes(id);
              const full = selectedIds.length >= max && !picked;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={full}
                  onClick={() => (picked ? onRemove(id) : onAdd(id))}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    picked ? 'border-[#3083ff] bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'
                  } ${full ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <img src={c.images?.[0] || '/pwa-192.png'} alt="" className="w-20 h-14 object-cover rounded-xl bg-slate-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-sm truncate">{c.title}</p>
                    <p className="text-xs font-bold text-slate-500">{[c.year, c.fuel, c.transmission].filter(Boolean).join(' · ')}</p>
                    <p className="font-black text-sm text-[#3083ff]">{formatINR(c.price)}</p>
                  </div>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${picked ? 'bg-[#3083ff]' : 'border-2 border-slate-300'}`}>
                    {picked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
        </div>
        <div className="p-4 border-t border-slate-100">
          <PrimaryButton className="w-full" onClick={onClose}>
            Done
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
