import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { SlidersHorizontal, X } from 'lucide-react';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import CarCard from '../components/CarCard';
import { CarGridSkeleton } from '../components/Skeletons';
import Pagination from '../components/Pagination';
import FilterSidebar from '../components/listing/FilterSidebar';
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
  isBudgetActive,
  parseBudgetQuery,
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

export default function Listing() {
  const [params, setParams] = useSearchParams();
  const { user } = useSelector((s) => s.auth);
  const { requireAuth } = useAuthGuard();
  const { brands, models, cities } = useReferenceData();
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    const controller = new AbortController();

    const fetchCars = async () => {
      setLoading(true);
      try {
        const clean = Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
        );
        if (clean.q && !clean.search) clean.search = clean.q;
        if (brandDocs.length) clean.brand = brandDocs.map((b) => b._id).join(',');
        if (modelDocs.length) clean.model = modelDocs.map((m) => m._id).join(',');
        if (cityDoc) clean.city = cityDoc.name || cityDoc._id;
        if (filters.state) clean.state = filters.state;
        if (filters.area) clean.area = filters.area;

        const { data } = await api.get('/cars', {
          params: { ...clean, limit: 12 },
          signal: controller.signal,
        });

        setCars(data.cars || []);
        setMeta({ total: data.total || 0, pages: data.pages || 1 });
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
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCars();

    return () => controller.abort();
  }, [JSON.stringify(filters), brandDocs.map((b) => b._id).join(','), modelDocs.map((m) => m._id).join(','), cityDoc?._id]);

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
      push('budget', 'Custom budget', { ...filters, minPrice: '', maxPrice: '', page: 1 });
    }
    const year = YEAR_RANGES.find(([, p]) => isBucketActive(p, 'minYear', 'maxYear', filters));
    if (year) push('year', year[0], { ...filters, minYear: '', maxYear: '', page: 1 });
    const km = KM_RANGES.find(([, p]) => isBucketActive(p, 'minKm', 'maxKm', filters));
    if (km) push('km', km[0], { ...filters, minKm: '', maxKm: '', page: 1 });
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
      <div className="bg-ink py-8">
        <div className="container-px">
          <h1 className="font-display font-bold text-3xl text-white">Used cars near you</h1>
          <p className="text-slate-300 text-sm mt-1">Every car below has passed 4tyrezz's manual inspection before being listed.</p>
        </div>
      </div>

      <div className="bg-slate-50">
      <div className="container-px py-8 pb-24 lg:pb-8 grid lg:grid-cols-[300px_1fr] gap-7 items-start">
        <aside className="hidden lg:block lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          {sidebar(false)}
        </aside>

        <div>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#3083ff]" />
                Filters
                {chips.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#3083ff] text-white text-[10px] leading-[18px] text-center">
                    {chips.length}
                  </span>
                )}
              </button>
              <strong className="font-display font-semibold text-xl">
                {loading ? '...' : `${meta.total} cars found`}
              </strong>
            </div>
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

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
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
            <CarGridSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cars.map((c) => (
                  <CarCard key={c._id} car={c} />
                ))}
              </div>
              {cars.length === 0 && (
                <p className="text-slate2 text-sm mt-4">
                  No cars match those filters yet. Try widening your budget or clearing a filter.
                </p>
              )}
              <Pagination
                page={Number(filters.page) || 1}
                pages={meta.pages}
                onChange={(p) => apply({ ...filters, page: p })}
              />
            </>
          )}
        </div>
      </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(100%,360px)] bg-slate-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
              <strong className="text-sm font-black">Filters</strong>
              <div className="flex items-center gap-3">
                <button type="button" onClick={clearAll} className="text-[12px] font-bold text-[#3083ff]">
                  Clear all
                </button>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-slate-500" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 pb-24">
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
