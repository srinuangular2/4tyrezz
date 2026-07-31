import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import CarCard from '../components/CarCard';
import { CarGridSkeleton } from '../components/Skeletons';
import Pagination from '../components/Pagination';

const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const OWNERSHIP = [1, 2, 3];

export default function Listing() {
  const [params, setParams] = useSearchParams();
  const { brands, cities } = useReferenceData();
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(Object.fromEntries(params));

  const fetchCars = async (f) => {
    setLoading(true);
    const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    const { data } = await api.get('/cars', { params: { ...clean, limit: 12 } });
    setCars(data.cars);
    setMeta({ total: data.total, pages: data.pages });
    setLoading(false);
  };

  useEffect(() => { fetchCars(filters); /* eslint-disable-next-line */ }, []);

  const apply = (next) => {
    setFilters(next);
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
    fetchCars(next);
  };

  const set = (key, value) => apply({ ...filters, [key]: value, page: 1 });

  return (
    <>
      <div className="bg-ink py-8">
        <div className="container-px">
          <h1 className="font-display font-black text-3xl text-white">Used cars near you</h1>
          <p className="text-slate-300 text-sm mt-1">Every car below has passed 4tyrezz's manual inspection before being listed.</p>
        </div>
      </div>

      <div className="container-px py-8 grid lg:grid-cols-[260px_1fr] gap-7 items-start">
        <aside className="bg-white border border-slate-100 rounded-2xl p-5 lg:sticky lg:top-24">
          <FilterGroup title="Search">
            <input
              value={filters.search || ''} onChange={(e) => set('search', e.target.value)}
              placeholder="Title, brand or model" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </FilterGroup>
          <FilterGroup title="Budget">
            <div className="flex gap-2">
              <input type="number" placeholder="Min ₹" value={filters.minPrice || ''} onChange={(e) => set('minPrice', e.target.value)} className="w-1/2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              <input type="number" placeholder="Max ₹" value={filters.maxPrice || ''} onChange={(e) => set('maxPrice', e.target.value)} className="w-1/2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </FilterGroup>
          <FilterGroup title="Brand">
            <select value={filters.brand || ''} onChange={(e) => set('brand', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Any brand</option>
              {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </FilterGroup>
          <FilterGroup title="Fuel type">
            <select value={filters.fuel || ''} onChange={(e) => set('fuel', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Any</option>
              {FUELS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </FilterGroup>
          <FilterGroup title="Transmission">
            <select value={filters.transmission || ''} onChange={(e) => set('transmission', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Any</option>
              {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </FilterGroup>
          <FilterGroup title="Ownership">
            <select value={filters.ownership || ''} onChange={(e) => set('ownership', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Any</option>
              {OWNERSHIP.map((o) => <option key={o} value={o}>{o === 1 ? '1st owner' : `${o}${o === 2 ? 'nd' : 'rd'} owner`}</option>)}
            </select>
          </FilterGroup>
          <FilterGroup title="Location" last>
            <select value={filters.city || ''} onChange={(e) => set('city', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Any city</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </FilterGroup>
        </aside>

        <div>
          <div className="flex justify-between items-center mb-4">
            <strong className="font-display font-extrabold text-xl">{loading ? '…' : `${meta.total} cars found`}</strong>
            <select value={filters.sort || '-createdAt'} onChange={(e) => set('sort', e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="-createdAt">Newest first</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-year">Year: Newest first</option>
            </select>
          </div>

          {loading ? <CarGridSkeleton /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cars.map((c) => <CarCard key={c._id} car={c} />)}
              </div>
              {cars.length === 0 && <p className="text-slate2 text-sm mt-4">No cars match those filters yet. Try widening your budget or clearing a filter.</p>}
              <Pagination page={Number(filters.page) || 1} pages={meta.pages} onChange={(p) => apply({ ...filters, page: p })} />
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
