import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { BookmarkPlus, SlidersHorizontal, X } from 'lucide-react';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import CarCard from '../components/CarCard';
import { CarGridSkeleton } from '../components/Skeletons';
import FilterSidebar from '../components/listing/FilterSidebar';
import UsedCarsBanner from '../components/listing/UsedCarsBanner';
import { describeFilters } from './profile/hubUtils';
import { useAuthGuard } from '../components/AuthGuardModal';
import {
  BUDGETS,
  BODY_TYPES,
  FUEL_TYPES,
  KM_RANGES,
  OWNER_TYPES,
  TRANSMISSIONS,
  YEAR_RANGES,
  COLORS,
  SEAT_OPTIONS,
  RTO_OPTIONS,
  isBudgetActive,
  parseBudgetQuery,
  formatPriceRangeLabel,
  formatKmRangeLabel,
} from '../utils/filterOptions';

function sameName(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

function matchRef(list, value) {
  if (!value || !list?.length) return null;
  return (
    list.find((row) => String(row._id) === String(value)) ||
    list.find((row) => sameName(row.name, value) || sameName(row.slug, value)) ||
    list.find((row) => String(value).toLowerCase().includes(String(row.name).toLowerCase())) ||
    null
  );
}

function matchRefs(list, value) {
  return asList(value).map((v) => matchRef(list, v)).filter(Boolean);
}

function isBucketActive(bucket, minKey, maxKey, filters) {
  const min = filters[minKey] === '' || filters[minKey] == null ? '' : Number(filters[minKey]);
  const max = filters[maxKey] === '' || filters[maxKey] == null ? '' : Number(filters[maxKey]);
  const bMin = bucket[minKey] == null ? '' : Number(bucket[minKey]);
  const bMax = bucket[maxKey] == null ? '' : Number(bucket[maxKey]);
  return min === bMin && max === bMax;
}

const KEEP_ON_CLEAR = ['sort'];
const PAGE_SIZE = 12;

export default function Listing() {
  const [params, setParams] = useSearchParams();
  const { user } = useSelector((s) => s.auth);
  const { requireAuth } = useAuthGuard();
  const { brands, models, cities } = useReferenceData();
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sentinelRef = useRef(null);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const listGen = useRef(0);

  const currentParamsObj = Object.fromEntries([...params.entries()]);
  const [filters, setFilters] = useState(currentParamsObj);

  useEffect(() => {
    const next = Object.fromEntries([...params.entries()]);
    const budget = parseBudgetQuery(next.q || next.search);
    if (budget && !next.minPrice && !next.maxPrice) {
      const q = {};
      if (budget.minPrice) q.minPrice = budget.minPrice;
      if (budget.maxPrice) q.maxPrice = budget.maxPrice;
      delete next.q;
      delete next.search;
      Object.assign(next, q);
      setFilters(next);
      setParams(next, { replace: true });
      return;
    }
    setFilters(next);
  }, [params]);

  const brandDocs = matchRefs(brands, filters.brand);
  const selectedBrandIds = brandDocs.map((b) => String(b._id));
  const brandModels = models.filter((m) => {
    if (!selectedBrandIds.length) return true;
    const bid = m.brand?._id || m.brand;
    return selectedBrandIds.includes(String(bid));
  });
  const modelDocs = matchRefs(brandModels, filters.model);
  const cityDoc = matchRef(cities, filters.city || filters.location);

  const brandKey = brandDocs.map((b) => b._id).join(',');
  const modelKey = modelDocs.map((m) => m._id).join(',');
  const cityKey = cityDoc?._id || cityDoc?.name || '';
  const listKey = useMemo(() => {
    const { page, ...rest } = filters;
    return JSON.stringify({ rest, brandKey, modelKey, cityKey });
  }, [filters, brandKey, modelKey, cityKey]);

  const buildParams = (page) => {
    const clean = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => key !== 'page' && value !== '' && value !== null && value !== undefined)
    );
    if (clean.q && !clean.search) clean.search = clean.q;
    if (brandDocs.length) clean.brand = brandDocs.map((b) => b._id).join(',');
    if (modelDocs.length) clean.model = modelDocs.map((m) => m._id).join(',');
    if (cityDoc) clean.city = cityDoc.name || cityDoc._id;
    if (filters.state) clean.state = filters.state;
    if (filters.area) clean.area = filters.area;
    return { ...clean, page, limit: PAGE_SIZE };
  };

  useEffect(() => {
    const controller = new AbortController();
    const gen = ++listGen.current;
    pageRef.current = 1;
    loadingMoreRef.current = false;
    setLoadingMore(false);

    const fetchCars = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/cars', {
          params: buildParams(1),
          signal: controller.signal,
        });
        if (listGen.current !== gen) return;
        const next = data.cars || [];
        const pages = data.pages || 1;
        setCars(next);
        setMeta({ total: data.total || 0, pages });
        setHasMore(pages > 1 && next.length > 0);
      } catch (err) {
        if (
          api.isCancel?.(err) ||
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED'
        ) {
          return;
        }
        console.error('Failed to load cars:', err);
        setCars([]);
        setMeta({ total: 0, pages: 1 });
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCars();
    window.scrollTo({ top: 0, behavior: 'auto' });

    return () => controller.abort();
  }, [listKey]);

  const loadMoreRef = useRef(async () => {});
  loadMoreRef.current = async () => {
    if (loadingMoreRef.current || loading || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const gen = listGen.current;
    const nextPage = pageRef.current + 1;
    try {
      const { data } = await api.get('/cars', { params: buildParams(nextPage) });
      if (listGen.current !== gen) return;
      const next = data.cars || [];
      const pages = data.pages || 1;
      setCars((prev) => {
        const seen = new Set(prev.map((car) => car._id));
        return [...prev, ...next.filter((car) => car && !seen.has(car._id))];
      });
      pageRef.current = nextPage;
      setMeta({ total: data.total || 0, pages });
      setHasMore(nextPage < pages && next.length > 0);
    } catch (err) {
      console.error('Failed to load more cars:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || !hasMore) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current();
    }, { rootMargin: '640px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, hasMore, cars.length]);

  const apply = (next) => {
    const clean = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    setFilters(clean);
    setParams(clean);
  };

  const set = (key, value) => {
    const next = { ...filters, [key]: value, page: 1 };
    if (key === 'search') delete next.q;
    apply(next);
  };

  const clearAll = () => {
    const kept = {};
    KEEP_ON_CLEAR.forEach((key) => {
      if (filters[key]) kept[key] = filters[key];
    });
    apply(kept);
  };

  const saveSearch = async () => {
    const run = async () => {
      const brandName = brandDocs.map((b) => b.name).join(', ') || filters.brand;
      const cityName = cityDoc?.name || filters.city;
      const named = describeFilters({ ...filters, brand: brandName, city: cityName });
      try {
        await api.post('/saved-searches', {
          name: named,
          filters,
          emailAlerts: true,
          newMatchAlerts: true,
          priceChangeAlerts: false,
        });
        toast.success('Search saved. We will alert you when matching cars appear');
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not save search');
      }
    };
    requireAuth(run);
  };

  const chips = useMemo(() => {
    const items = [];
    const push = (key, label, next) => items.push({ key, label, next });

    if (filters.search || filters.q) {
      push('search', `"${filters.search || filters.q}"`, { ...filters, search: '', q: '', page: 1 });
    }
    brandDocs.forEach((b) => {
      const nextBrand = brandDocs.filter((x) => x._id !== b._id).map((x) => x._id).join(',');
      const nextModel = modelDocs
        .filter((m) => String(m.brand?._id || m.brand) !== String(b._id))
        .map((m) => m._id)
        .join(',');
      push(`brand-${b._id}`, b.name, { ...filters, brand: nextBrand, model: nextModel, page: 1 });
    });
    modelDocs.forEach((m) => {
      const nextModel = modelDocs.filter((x) => x._id !== m._id).map((x) => x._id).join(',');
      push(`model-${m._id}`, m.name, { ...filters, model: nextModel, page: 1 });
    });
    const budget = BUDGETS.find((b) => isBudgetActive(b, filters.minPrice, filters.maxPrice));
    if (budget) {
      push('budget', budget.label, { ...filters, minPrice: '', maxPrice: '', page: 1 });
    } else if (filters.minPrice || filters.maxPrice) {
      push('budget', formatPriceRangeLabel(filters.minPrice, filters.maxPrice) || 'Custom budget', { ...filters, minPrice: '', maxPrice: '', page: 1 });
    }
    const year = YEAR_RANGES.find(([, p]) => isBucketActive(p, 'minYear', 'maxYear', filters));
    if (year) push('year', year[0], { ...filters, minYear: '', maxYear: '', page: 1 });
    const km = KM_RANGES.find(([, p]) => isBucketActive(p, 'minKm', 'maxKm', filters));
    if (km) push('km', km[0], { ...filters, minKm: '', maxKm: '', page: 1 });
    else if (filters.minKm || filters.maxKm) {
      push('km', formatKmRangeLabel(filters.minKm, filters.maxKm) || 'Custom km', { ...filters, minKm: '', maxKm: '', page: 1 });
    }
    asList(filters.fuel).forEach((fuel) => {
      const next = asList(filters.fuel).filter((v) => v !== fuel).join(',');
      push(`fuel-${fuel}`, FUEL_TYPES.find((f) => sameName(f, fuel)) || fuel, { ...filters, fuel: next, page: 1 });
    });
    asList(filters.transmission).forEach((t) => {
      const next = asList(filters.transmission).filter((v) => v !== t).join(',');
      push(`tr-${t}`, TRANSMISSIONS.find((x) => sameName(x, t)) || t, { ...filters, transmission: next, page: 1 });
    });
    asList(filters.bodyType).forEach((t) => {
      const next = asList(filters.bodyType).filter((v) => v !== t).join(',');
      push(`body-${t}`, BODY_TYPES.find((x) => sameName(x, t)) || t, { ...filters, bodyType: next, page: 1 });
    });
    asList(filters.ownership).forEach((o) => {
      const next = asList(filters.ownership).filter((v) => String(v) !== String(o)).join(',');
      const label = OWNER_TYPES.find(([, p]) => String(p.ownership) === String(o))?.[0] || `${o} owner`;
      push(`own-${o}`, label, { ...filters, ownership: next, page: 1 });
    });
    asList(filters.color).forEach((color) => {
      const next = asList(filters.color).filter((v) => !sameName(v, color)).join(',');
      push(`color-${color}`, COLORS.find((c) => sameName(c, color)) || color, { ...filters, color: next, page: 1 });
    });
    asList(filters.seats).forEach((seat) => {
      const next = asList(filters.seats).filter((v) => String(v) !== String(seat)).join(',');
      const label = SEAT_OPTIONS.find((s) => String(s.value) === String(seat))?.label || `${seat} seater`;
      push(`seats-${seat}`, label, { ...filters, seats: next, page: 1 });
    });
    asList(filters.rto).forEach((rto) => {
      const next = asList(filters.rto).filter((v) => !sameName(v, rto)).join(',');
      const label = RTO_OPTIONS.find((r) => sameName(r.value, rto))?.label || rto;
      push(`rto-${rto}`, label, { ...filters, rto: next, page: 1 });
    });
    if (filters.city) push('city', cityDoc?.name || filters.city, { ...filters, city: '', area: '', page: 1 });
    asList(filters.area).forEach((area) => {
      const next = asList(filters.area).filter((v) => v !== area).join(',');
      push(`area-${area}`, area, { ...filters, area: next, page: 1 });
    });
    return items;
  }, [filters, brandDocs, modelDocs, cityDoc]);

  const sidebar = (compact) => (
    <FilterSidebar
      filters={{ ...filters, city: cityDoc?.name || filters.city }}
      apply={apply}
      brands={brands}
      models={models}
      onClear={clearAll}
      canSave={user?.role !== 'dealer'}
      onSaveSearch={saveSearch}
      compact={compact}
    />
  );

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="hidden lg:block">
        <UsedCarsBanner />
      </div>

      <div className="bg-slate-50 lg:bg-slate-50 min-h-screen">
      <div className="lg:container-px lg:py-8 pb-6 lg:pb-8 grid lg:grid-cols-[300px_1fr] gap-7 items-start">
        <aside className="hidden lg:sticky lg:top-20 lg:z-30 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          {sidebar(false)}
        </aside>

        <div>
          <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#3083ff] px-3 text-[12px] font-bold text-white"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {chips.length > 0 && (
                  <span className="min-w-[16px] h-4 rounded-full bg-white px-1 text-center text-[10px] leading-4 text-[#3083ff]">
                    {chips.length}
                  </span>
                )}
              </button>
              <p className="flex-1 truncate text-[13px] font-bold text-slate-800">
                {loading ? 'Finding cars…' : `${meta.total} cars`}
              </p>
              <select
                value={filters.sort || '-createdAt'}
                onChange={(e) => set('sort', e.target.value)}
                className="h-9 max-w-[132px] rounded-full border border-slate-200 bg-white px-2.5 text-[12px] font-bold"
              >
                <option value="-createdAt">Newest</option>
                <option value="price">Price ↑</option>
                <option value="-price">Price ↓</option>
                <option value="-year">Year</option>
              </select>
            </div>
            {chips.length > 0 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => apply(chip.next)}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-blue-50 pl-2.5 pr-1.5 text-[11px] font-bold text-[#1853ff]"
                  >
                    {chip.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="shrink-0 px-1 text-[11px] font-bold text-slate-500">
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="sticky top-20 z-30 mb-4 hidden flex-wrap items-center justify-between gap-3 bg-white/95 py-2 shadow-sm backdrop-blur-md lg:flex">
            <strong className="font-display font-semibold text-xl">
              {loading ? '...' : `${meta.total} cars found`}
            </strong>
            <div className="flex items-center gap-2">
              {user?.role !== 'dealer' && (
                <button
                  type="button"
                  onClick={saveSearch}
                  className="inline-flex items-center gap-1.5 border border-[#3083ff]/30 bg-white text-[#1853ff] rounded-xl px-3 py-2 text-xs font-black hover:bg-blue-50 transition"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Save search
                </button>
              )}
              <select
                value={filters.sort || '-createdAt'}
                onChange={(e) => set('sort', e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="-createdAt">Newest first</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-year">Year: Newest first</option>
              </select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="hidden lg:flex flex-wrap items-center gap-2 mb-4">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => apply(chip.next)}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50 text-[#1853ff] text-[12px] font-bold border border-blue-100"
                >
                  {chip.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="text-[12px] font-bold text-slate-500 hover:text-[#3083ff]">
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="px-3 lg:px-0 pt-3 lg:pt-0">
              <CarGridSkeleton />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-5 px-3 lg:px-0 pt-3 lg:pt-0">
                {cars.map((c) => (
                  <CarCard key={c._id} car={c} />
                ))}
              </div>
              {cars.length === 0 && (
                <p className="text-slate2 text-sm mt-4 px-3 lg:px-0">
                  No cars match those filters yet. Try widening your budget or clearing a filter.
                </p>
              )}
              <div ref={sentinelRef} className="h-8" />
              {loadingMore && (
                <p className="py-4 text-center text-[13px] font-bold text-slate-500">Loading more cars…</p>
              )}
              {!hasMore && cars.length > 0 && (
                <p className="py-4 text-center text-[12px] font-semibold text-slate-400">
                  You have seen all {meta.total} cars
                </p>
              )}
            </>
          )}
        </div>
      </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-8 bg-slate-50 rounded-t-3xl shadow-2xl flex flex-col">
            <div className="pt-2 pb-1 flex justify-center bg-white rounded-t-3xl">
              <span className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
              <strong className="text-sm font-black">Filters</strong>
              <div className="flex items-center gap-3">
                {user?.role !== 'dealer' && (
                  <button type="button" onClick={saveSearch} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#3083ff]">
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
                <button type="button" onClick={clearAll} className="text-[12px] font-bold text-[#3083ff]">
                  Clear all
                </button>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-slate-500" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 pb-24">
              <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-[12px] font-semibold text-slate-500">Recommended filters</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ['Under ₹5 Lakh', { minPrice: '', maxPrice: '500000' }],
                    ['Under ₹10 Lakh', { minPrice: '', maxPrice: '1000000' }],
                    ['Petrol', { fuel: 'Petrol' }],
                    ['Automatic', { transmission: 'Automatic' }],
                    ['1st owner', { ownership: '1' }],
                  ].map(([label, patch]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => apply({ ...filters, ...patch, page: 1 })}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {sidebar(true)}
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-full bg-[#3083ff] text-white font-black rounded-xl py-3 text-sm"
              >
                Show {loading ? 'cars' : `${meta.total} cars`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
