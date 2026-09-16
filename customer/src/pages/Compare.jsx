import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import api from '../api/axios';
import { GhostButton, PrimaryButton, Section, Skeleton, formatINR } from '../components/PageShell';
import CompareBanner from '../components/compare/CompareBanner';
import CompareVsCard from '../components/CompareVsCard';
import CompareCarPicker from '../components/CompareCarPicker';
import CompareDetailsBoard from '../components/CompareDetailsBoard';
import { COMPARE_MAX } from '../lib/compareMatrix';

export default function Compare() {
  const { user } = useSelector((s) => s.auth);
  const [params, setParams] = useSearchParams();
  const idsParam = params.get('ids') || '';
  const ids = useMemo(() => idsParam.split(',').map((s) => s.trim()).filter(Boolean), [idsParam]);

  const [cars, setCars] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [pairsPage, setPairsPage] = useState(1);
  const [pairsHasMore, setPairsHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [pairsLoadingMore, setPairsLoadingMore] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPairsLoading(true);
    api
      .get('/compare/suggested', { params: { page: 1, limit: 10 } })
      .then((r) => {
        if (cancelled) return;
        setPairs(r.data.data || []);
        setPairsPage(1);
        setPairsHasMore(Boolean(r.data.hasMore));
      })
      .catch(() => {
        if (!cancelled) setPairs([]);
      })
      .finally(() => {
        if (!cancelled) setPairsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!pairsHasMore || pairsLoading || ids.length > 0) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setPairsLoadingMore(true);
      api
        .get('/compare/suggested', { params: { page: pairsPage + 1, limit: 10 } })
        .then((r) => {
          const next = r.data.data || [];
          setPairs((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...next.filter((p) => !seen.has(p.id))];
          });
          setPairsPage((p) => p + 1);
          setPairsHasMore(Boolean(r.data.hasMore) && next.length > 0);
        })
        .catch(() => setPairsHasMore(false))
        .finally(() => {
          loadingMoreRef.current = false;
          setPairsLoadingMore(false);
        });
    }, { rootMargin: '240px' });
    io.observe(node);
    return () => io.disconnect();
  }, [pairsHasMore, pairsLoading, pairsPage, ids.length, pairs.length]);

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
    if (ids.includes(id) || ids.length >= COMPARE_MAX) return;
    setIds([...ids, id]);
  };

  const removeCar = (id) => setIds(ids.filter((x) => x !== id));
  const slots = [...cars, ...Array.from({ length: Math.max(0, COMPARE_MAX - cars.length) }, () => null)].slice(0, COMPARE_MAX);

  return (
    <div className="bg-slate-50 min-h-screen">
      <CompareBanner>
        <nav className="mt-6 text-sm text-white/75 flex flex-wrap items-center gap-1.5">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link to="/compare" className="hover:text-white transition">Compare</Link>
          {cars.length >= 2 && (
            <>
              <span>/</span>
              <span className="text-white font-medium truncate max-w-[min(100%,28rem)]">
                {cars.map((c) => c.model || c.title).filter(Boolean).join(' vs ')}
              </span>
            </>
          )}
        </nav>
        <div className="flex flex-wrap gap-3 mt-6">
          <PrimaryButton onClick={() => setPickerOpen(true)}>
            {ids.length ? 'Add another listing' : 'Build a matchup'}
          </PrimaryButton>
          {ids.length > 0 && <GhostButton onClick={() => setIds([])}>Reset</GhostButton>}
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
      </CompareBanner>

      {ids.length < 2 && (
        <Section eyebrow="Build a matchup" title={<>Compare <span className="font-black"> cars</span></>}>
          {loading && ids.length === 1 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              {ids.length === 1 && (
                <p className="text-sm font-semibold text-slate-500 mb-5">Add a second listing to compare.</p>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {slots.map((c, i) =>
                  c ? (
                    <div key={c.id} className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeCar(c.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center"
                        aria-label={`Remove ${c.title}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <img src={c.images?.[0] || '/pwa-192.png'} alt="" className="w-full h-28 object-contain bg-white rounded-xl" />
                      <p className="text-[11px] font-bold text-slate-400 mt-2">{c.brand || '—'}</p>
                      <p className="font-semibold text-slate-900 text-sm truncate">{c.model || c.title}</p>
                      <p className="font-bold text-slate-900 mt-1">{formatINR(c.price)}</p>
                    </div>
                  ) : (
                    <button
                      key={`empty-${i}`}
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="rounded-2xl border-2 border-dashed border-slate-200 min-h-[220px] flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-[#3083ff] hover:text-[#3083ff] hover:bg-[#3083ff]/5 transition"
                    >
                      <span className="w-14 h-14 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                      </span>
                      <span className="text-sm font-semibold">Add car {i + 1}</span>
                    </button>
                  )
                )}
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  disabled={ids.length < 2}
                  onClick={() => toast.error('Add at least two cars to compare')}
                  className="px-8 py-3 rounded-xl bg-[#3083ff] text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Compare now
                </button>
              </div>
            </div>
          )}
        </Section>
      )}

      {ids.length === 0 && (
        <Section
          eyebrow="Popular comparisons"
          title={<>Compare to buy the <span className="font-black">right car</span></>}
          className="bg-gradient-to-b from-blue-50/70"
        >
          {pairsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : pairs.length === 0 ? (
            <div className="rounded-3xl bg-white/50 backdrop-blur-xl border border-white/70 p-10 text-center">
              <p className="font-black text-slate-900">No pairings yet</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Listings appear here as soon as two approved cars are live.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {pairs.map((pair) => (
                  <CompareVsCard key={pair.id} pair={pair} onOpen={() => setIds(pair.ids)} />
                ))}
              </div>
              {pairsHasMore && <div ref={sentinelRef} className="h-10" />}
              {pairsLoadingMore && (
                <p className="text-center text-sm font-semibold text-slate-500 mt-4">Loading more comparisons…</p>
              )}
            </>
          )}
        </Section>
      )}

      {ids.length >= 2 && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="max-w-6xl mx-auto grid grid-cols-2 gap-4">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : (
            <CompareDetailsBoard
              cars={cars}
              ids={ids}
              onRemove={removeCar}
              onAddClick={() => setPickerOpen(true)}
            />
          )}
        </div>
      )}

      {pickerOpen && (
        <CompareCarPicker selectedIds={ids} max={COMPARE_MAX} onAdd={addCar} onRemove={removeCar} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
