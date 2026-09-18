import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import api from '../../api/axios';
import {
  BUDGETS,
  BODY_TYPES,
  FUEL_TYPES,
  KM_RANGES,
  OWNER_TYPES,
  TRANSMISSIONS,
  YEAR_RANGES,
  budgetQuery,
  isBudgetActive,
} from '../../utils/filterOptions';

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

function sameId(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function brandIdOf(model) {
  return String(model?.brand?._id || model?.brand || '');
}

function isBucketActive(bucket, minKey, maxKey, filters) {
  const min = filters[minKey] === '' || filters[minKey] == null ? '' : Number(filters[minKey]);
  const max = filters[maxKey] === '' || filters[maxKey] == null ? '' : Number(filters[maxKey]);
  const bMin = bucket[minKey] == null ? '' : Number(bucket[minKey]);
  const bMax = bucket[maxKey] == null ? '' : Number(bucket[maxKey]);
  return min === bMin && max === bMax;
}

function FilterCard({ title, defaultOpen = true, activeCount = 0, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left"
      >
        <span className="text-[12px] font-black uppercase tracking-wide text-slate-800">{title}</span>
        <span className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#3083ff] text-white text-[10px] font-black leading-[18px] text-center">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && <div className="px-3.5 pb-3.5">{children}</div>}
    </section>
  );
}

function CheckRow({ checked, onChange, label, count }) {
  return (
    <label className="flex items-center gap-2.5 py-[5px] cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-slate-300 text-[#3083ff] focus:ring-[#3083ff] w-3.5 h-3.5"
      />
      <span className={`flex-1 text-[13px] truncate ${checked ? 'font-bold text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
        {label}
      </span>
      {count != null && count !== '' && (
        <span className="text-[11px] font-bold text-slate-400 tabular-nums">{count}</span>
      )}
    </label>
  );
}

function ShowMoreList({ items, limit = 6, render }) {
  const [more, setMore] = useState(false);
  const visible = more ? items : items.slice(0, limit);
  return (
    <div>
      <div className="space-y-0.5">{visible.map(render)}</div>
      {items.length > limit && (
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="mt-1.5 text-[12px] font-bold text-[#3083ff] hover:underline"
        >
          {more ? 'Show less' : `+ Show more (${items.length - limit})`}
        </button>
      )}
    </div>
  );
}

export default function FilterSidebar({
  filters,
  apply,
  brands = [],
  models = [],
  onClear,
  canSave,
  onSaveSearch,
  compact = false,
}) {
  const selectedCity = String(filters.city || '').trim();
  const selectedAreas = asList(filters.area);
  const selectedBrands = asList(filters.brand);
  const selectedModels = asList(filters.model);
  const selectedFuels = asList(filters.fuel);
  const selectedTransmissions = asList(filters.transmission);
  const selectedBodies = asList(filters.bodyType);
  const selectedOwners = asList(filters.ownership);

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [popular, setPopular] = useState([]);
  const [catalogQuery, setCatalogQuery] = useState('');

  useEffect(() => {
    api.get('/locations/active-cities').then(({ data }) => {
      setCities(data.cities || []);
    }).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    const cityName = selectedCity && !/^[a-fA-F0-9]{24}$/.test(selectedCity) ? selectedCity : '';
    const fromList = cities.find((c) => c.id === selectedCity || c.name === selectedCity);
    const city = cityName || fromList?.name || '';
    api.get('/locations/areas', { params: city ? { city } : {} }).then(({ data }) => {
      setAreas(data.areas || []);
      setPopular(data.popular || []);
    }).catch(() => {
      setAreas([]);
      setPopular([]);
    });
  }, [selectedCity, cities]);

  const patch = (next) => apply({ ...filters, ...next, page: 1 });

  const toggleCsv = (key, value, extra = {}) => {
    const current = asList(filters[key]);
    const exists = current.some((v) => sameId(v, value));
    const next = exists ? current.filter((v) => !sameId(v, value)) : [...current, String(value)];
    patch({ [key]: next.join(','), ...extra });
  };

  const toggleBucket = (minKey, maxKey, bucket) => {
    const active = isBucketActive(bucket, minKey, maxKey, filters);
    patch({
      [minKey]: active ? '' : (bucket[minKey] ?? ''),
      [maxKey]: active ? '' : (bucket[maxKey] ?? ''),
    });
  };

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      if (Boolean(a.isPopular) !== Boolean(b.isPopular)) return a.isPopular ? -1 : 1;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [brands]);

  const q = catalogQuery.trim().toLowerCase();
  const visibleBrands = useMemo(() => {
    if (!q) return sortedBrands;
    const matchedBrandIds = new Set();
    models.forEach((m) => {
      if (String(m.name || '').toLowerCase().includes(q)) matchedBrandIds.add(brandIdOf(m));
    });
    return sortedBrands.filter((b) => (
      String(b.name || '').toLowerCase().includes(q) || matchedBrandIds.has(String(b._id))
    ));
  }, [sortedBrands, models, q]);

  const selectedBrandDocs = brands.filter((b) => selectedBrands.some((id) => sameId(id, b._id) || sameId(id, b.name) || sameId(id, b.slug)));
  const selectedBrandIds = selectedBrandDocs.map((b) => String(b._id));

  const brandModels = useMemo(() => {
    if (!selectedBrandIds.length) return [];
    return models.filter((m) => selectedBrandIds.includes(brandIdOf(m)));
  }, [models, selectedBrandIds]);

  const visibleModels = useMemo(() => {
    const list = [...brandModels].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (!q) return list;
    return list.filter((m) => String(m.name || '').toLowerCase().includes(q));
  }, [brandModels, q]);

  const matchingModels = useMemo(() => {
    if (!q || selectedBrandIds.length) return [];
    return models
      .filter((m) => String(m.name || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [models, q, selectedBrandIds.length]);

  const toggleBrand = (brand) => {
    const id = String(brand._id);
    const exists = selectedBrands.some((v) => sameId(v, id) || sameId(v, brand.name));
    const nextBrands = exists
      ? selectedBrandDocs.filter((b) => String(b._id) !== id).map((b) => String(b._id))
      : [...selectedBrandDocs.map((b) => String(b._id)), id];
    const keepIds = new Set(nextBrands);
    const nextModels = selectedModels.filter((mid) => {
      const model = models.find((m) => sameId(m._id, mid) || sameId(m.name, mid));
      return model && keepIds.has(brandIdOf(model));
    });
    patch({ brand: nextBrands.join(','), model: nextModels.join(',') });
  };

  const toggleModel = (model) => {
    const id = String(model._id);
    const parent = brandIdOf(model);
    const exists = selectedModels.some((v) => sameId(v, id) || sameId(v, model.name));
    const nextModels = exists
      ? selectedModels.filter((v) => !sameId(v, id) && !sameId(v, model.name))
      : [...selectedModels, id];
    const brandAlready = selectedBrands.some((v) => sameId(v, parent));
    patch({
      model: nextModels.join(','),
      brand: brandAlready || !parent ? filters.brand : [...selectedBrandIds, parent].join(','),
    });
  };

  const toggleArea = (name) => {
    const next = selectedAreas.includes(name)
      ? selectedAreas.filter((a) => a !== name)
      : [...selectedAreas, name];
    patch({ area: next.join(',') });
  };

  const yearActiveCount = YEAR_RANGES.some(([, p]) => isBucketActive(p, 'minYear', 'maxYear', filters)) ? 1 : 0;
  const kmActiveCount = KM_RANGES.some(([, p]) => isBucketActive(p, 'minKm', 'maxKm', filters)) ? 1 : 0;
  const budgetActiveCount = (filters.minPrice || filters.maxPrice) ? 1 : 0;

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-0.5 py-1 bg-slate-50/95 backdrop-blur-sm">
          <h3 className="text-sm font-black text-slate-900">Filters</h3>
          {onClear && (
            <button type="button" onClick={onClear} className="text-[12px] font-bold text-[#3083ff] hover:underline">
              Clear all
            </button>
          )}
        </div>
      )}

      <section className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-3.5">
        <label className="sr-only" htmlFor="listing-search">Search cars</label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="listing-search"
            value={filters.search || filters.q || ''}
            onChange={(e) => {
              const next = { ...filters, search: e.target.value, page: 1 };
              delete next.q;
              apply(next);
            }}
            placeholder="Title, brand or model"
            className="w-full border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-[13px] bg-white text-slate-900 outline-none focus:ring-2 focus:ring-[#3083ff]/30 focus:border-[#3083ff]"
          />
          {(filters.search || filters.q) && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                const next = { ...filters, search: '', page: 1 };
                delete next.q;
                apply(next);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      <FilterCard title="Budget" activeCount={budgetActiveCount}>
        <ShowMoreList
          items={BUDGETS}
          limit={6}
          render={(b) => {
            const active = isBudgetActive(b, filters.minPrice, filters.maxPrice);
            return (
              <CheckRow
                key={b.label}
                checked={active}
                label={b.label}
                onChange={() => {
                  const q = budgetQuery(b);
                  patch({
                    minPrice: active ? '' : (q.minPrice || ''),
                    maxPrice: active ? '' : (q.maxPrice || ''),
                  });
                }}
              />
            );
          }}
        />
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3 mb-2">Custom range (₹)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => patch({ minPrice: e.target.value })}
            className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] bg-white text-slate-900"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => patch({ maxPrice: e.target.value })}
            className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] bg-white text-slate-900"
          />
        </div>
      </FilterCard>

      <FilterCard title="Brand & model" activeCount={selectedBrands.length + selectedModels.length} defaultOpen>
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={catalogQuery}
            onChange={(e) => setCatalogQuery(e.target.value)}
            placeholder="Search brand or model"
            className="w-full border border-slate-200 rounded-lg pl-8 py-2 text-[13px] bg-white outline-none focus:ring-2 focus:ring-[#3083ff]/30 focus:border-[#3083ff]"
          />
        </div>
        {sortedBrands.some((b) => b.isPopular) && !q && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Popular brands</p>
        )}
        <ShowMoreList
          items={visibleBrands}
          limit={8}
          render={(b) => (
            <CheckRow
              key={b._id}
              checked={selectedBrands.some((v) => sameId(v, b._id) || sameId(v, b.name) || sameId(v, b.slug))}
              label={b.name}
              onChange={() => toggleBrand(b)}
            />
          )}
        />
        {matchingModels.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Matching models</p>
            {matchingModels.map((m) => {
              const parent = brands.find((b) => String(b._id) === brandIdOf(m));
              return (
                <CheckRow
                  key={m._id}
                  checked={selectedModels.some((v) => sameId(v, m._id) || sameId(v, m.name))}
                  label={parent ? `${parent.name} ${m.name}` : m.name}
                  onChange={() => toggleModel(m)}
                />
              );
            })}
          </div>
        )}
        {selectedBrandIds.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Model</p>
            {visibleModels.length === 0 ? (
              <p className="text-[12px] text-slate-400">No models for the selected brand.</p>
            ) : (
              <ShowMoreList
                items={visibleModels}
                limit={8}
                render={(m) => (
                  <CheckRow
                    key={m._id}
                    checked={selectedModels.some((v) => sameId(v, m._id) || sameId(v, m.name))}
                    label={m.name}
                    onChange={() => toggleModel(m)}
                  />
                )}
              />
            )}
          </div>
        )}
      </FilterCard>

      <FilterCard title="Model year" activeCount={yearActiveCount}>
        {YEAR_RANGES.map(([label, params]) => (
          <CheckRow
            key={label}
            checked={isBucketActive(params, 'minYear', 'maxYear', filters)}
            label={label}
            onChange={() => toggleBucket('minYear', 'maxYear', params)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Kilometers" activeCount={kmActiveCount}>
        {KM_RANGES.map(([label, params]) => (
          <CheckRow
            key={label}
            checked={isBucketActive(params, 'minKm', 'maxKm', filters)}
            label={label}
            onChange={() => toggleBucket('minKm', 'maxKm', params)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Fuel type" activeCount={selectedFuels.length} defaultOpen>
        {FUEL_TYPES.map((fuel) => (
          <CheckRow
            key={fuel}
            checked={selectedFuels.some((v) => sameId(v, fuel))}
            label={fuel}
            onChange={() => toggleCsv('fuel', fuel)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Transmission" activeCount={selectedTransmissions.length}>
        {TRANSMISSIONS.map((t) => (
          <CheckRow
            key={t}
            checked={selectedTransmissions.some((v) => sameId(v, t))}
            label={t}
            onChange={() => toggleCsv('transmission', t)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Body type" activeCount={selectedBodies.length}>
        {BODY_TYPES.map((t) => (
          <CheckRow
            key={t}
            checked={selectedBodies.some((v) => sameId(v, t))}
            label={t}
            onChange={() => toggleCsv('bodyType', t)}
          />
        ))}
      </FilterCard>

      <FilterCard title="Ownership" activeCount={selectedOwners.length}>
        {OWNER_TYPES.map(([label, params]) => (
          <CheckRow
            key={label}
            checked={selectedOwners.some((v) => String(v) === String(params.ownership))}
            label={label}
            onChange={() => toggleCsv('ownership', params.ownership)}
          />
        ))}
      </FilterCard>

      <FilterCard title="City" activeCount={selectedCity ? 1 : 0} defaultOpen>
        <select
          value={filters.city || ''}
          onChange={(e) => patch({ city: e.target.value, area: '' })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-white text-slate-900"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}{c.state ? `, ${c.state}` : ''} {c.count ? `(${c.count})` : ''}
            </option>
          ))}
        </select>
      </FilterCard>

      {popular.length > 0 && (
        <FilterCard title="Popular localities" activeCount={selectedAreas.filter((a) => popular.some((p) => p.name === a)).length}>
          <div className="flex flex-wrap gap-1.5">
            {popular.map((row) => {
              const on = selectedAreas.includes(row.name);
              return (
                <button
                  key={row.name}
                  type="button"
                  onClick={() => toggleArea(row.name)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    on
                      ? 'border-[#3083ff] bg-blue-50 text-[#3083ff]'
                      : 'border-slate-200 text-slate-700 hover:border-[#3083ff]'
                  }`}
                >
                  {row.name} {row.count ? `(${row.count})` : ''}
                </button>
              );
            })}
          </div>
        </FilterCard>
      )}

      {areas.length > 0 && (
        <FilterCard title="Locality / Area" activeCount={selectedAreas.length} defaultOpen={false}>
          <ShowMoreList
            items={areas}
            limit={8}
            render={(row) => (
              <CheckRow
                key={row.name}
                checked={selectedAreas.includes(row.name)}
                label={row.name}
                count={row.count || 0}
                onChange={() => toggleArea(row.name)}
              />
            )}
          />
        </FilterCard>
      )}

      {canSave && onSaveSearch && (
        <button
          type="button"
          onClick={onSaveSearch}
          className="w-full bg-[#3083ff] text-white font-black rounded-xl py-2.5 text-xs shadow-lg shadow-blue-500/20 hover:brightness-110 transition"
        >
          Save this search
        </button>
      )}
    </div>
  );
}
