import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import CarCard from '../components/CarCard';
import { CarGridSkeleton } from '../components/Skeletons';
import Pagination from '../components/Pagination';
import FilterSidebar from '../components/listing/FilterSidebar';
import { describeFilters } from './profile/hubUtils';
import { useAuthGuard } from '../components/AuthGuardModal';

const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'];
const OWNERSHIP = [1, 2, 3];

function sameName(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
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

export default function Listing() {
  const [params, setParams] = useSearchParams();
  const { user } = useSelector((s) => s.auth);
  const { requireAuth } = useAuthGuard();
  const { brands, models, cities } = useReferenceData();
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Parse URL search params into object
  const currentParamsObj = Object.fromEntries([...params.entries()]);
  const [filters, setFilters] = useState(currentParamsObj);

  // 1. Keep state synced with URL search params when route changes
  useEffect(() => {
    setFilters(Object.fromEntries([...params.entries()]));
  }, [params]);

  const searchValue = filters.search || filters.q || '';
  const brandDoc = matchRef(brands, filters.brand);
  const modelDoc = matchRef(
    models.filter((m) => !brandDoc || String(m.brand) === String(brandDoc._id) || m.brand?._id === brandDoc._id),
    filters.model
  );
  const cityDoc = matchRef(cities, filters.city || filters.location);
  const brandModels = models.filter((m) => {
    if (!brandDoc) return true;
    const bid = m.brand?._id || m.brand;
    return String(bid) === String(brandDoc._id);
  });

  // 2. Main data fetching effect triggered whenever filters change
  useEffect(() => {
    const controller = new AbortController();

    const fetchCars = async () => {
      setLoading(true);
      try {
        const clean = Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
        );
        if (clean.q && !clean.search) clean.search = clean.q;
        if (brandDoc) clean.brand = brandDoc._id;
        if (modelDoc) clean.model = modelDoc._id;
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
  }, [JSON.stringify(filters), brandDoc?._id, modelDoc?._id, cityDoc?._id]);

  // Apply new filters to state + URL query string
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

  const saveSearch = async () => {
    const run = async () => {
      const brandName = brandDoc?.name || filters.brand;
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

  return (
    <>
      <div className="bg-ink py-8">
        <div className="container-px">
          <h1 className="font-display font-bold text-3xl text-white">Used cars near you</h1>
          <p className="text-slate-300 text-sm mt-1">Every car below has passed 4tyrezz's manual inspection before being listed.</p>
        </div>
      </div>

      <div className="container-px py-8 grid lg:grid-cols-[260px_1fr] gap-7 items-start">
        <aside className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-2xl p-5 lg:sticky lg:top-24">
          <FilterGroup title="Search">
            <input
              value={searchValue}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Title, brand or model"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </FilterGroup>

          <FilterSidebar
            filters={{ ...filters, city: cityDoc?.name || filters.city }}
            apply={apply}
          />

          <FilterGroup title="Budget">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={filters.minPrice || ''}
                onChange={(e) => set('minPrice', e.target.value)}
                className="w-1/2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={filters.maxPrice || ''}
                onChange={(e) => set('maxPrice', e.target.value)}
                className="w-1/2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </FilterGroup>

          <FilterGroup title="Brand">
            <select
              value={brandDoc?._id || ''}
              onChange={(e) => apply({ ...filters, brand: e.target.value, model: '', page: 1 })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Any brand</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Model">
            <select
              value={modelDoc?._id || ''}
              onChange={(e) => set('model', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Any model</option>
              {brandModels.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Body type">
            <select
              value={filters.bodyType || ''}
              onChange={(e) => set('bodyType', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Any</option>
              {BODY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Fuel type">
            <select
              value={filters.fuel || ''}
              onChange={(e) => set('fuel', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Any</option>
              {FUELS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Transmission">
            <select
              value={filters.transmission || ''}
              onChange={(e) => set('transmission', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Any</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Ownership">
            <select
              value={filters.ownership || ''}
              onChange={(e) => set('ownership', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Any</option>
              {OWNERSHIP.map((o) => (
                <option key={o} value={o}>
                  {o === 1 ? '1st owner' : `${o}${o === 2 ? 'nd' : 'rd'} owner`}
                </option>
              ))}
            </select>
          </FilterGroup>
          {user?.role !== 'dealer' && (
            <button
              type="button"
              onClick={saveSearch}
              className="mt-4 w-full bg-[#3083ff] text-white font-black rounded-xl py-2.5 text-xs shadow-lg shadow-blue-500/20 hover:brightness-110 transition"
            >
              Save this search
            </button>
          )}
        </aside>

        <div>
          <div className="flex justify-between items-center mb-4">
            <strong className="font-display font-semibold text-xl">
              {loading ? '...' : `${meta.total} cars found`}
            </strong>
            <select
              value={filters.sort || '-createdAt'}
              onChange={(e) => set('sort', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="-createdAt">Newest first</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-year">Year: Newest first</option>
            </select>
          </div>

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
    </>
  );
}

function FilterGroup({ title, children, last }) {
  return (
    <div className={`pb-5 mb-5 ${last ? '' : 'border-b border-slate-100'}`}>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate2 mb-2">{title}</h4>
      {children}
    </div>
  );
}