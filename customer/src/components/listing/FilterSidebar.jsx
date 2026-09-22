import { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  BookmarkPlus,
  Calendar,
  Car,
  Fuel,
  Gauge,
  IndianRupee,
  MapPin,
  Minus,
  Palette,
  Plus,
  Search,
  Settings2,
  Landmark,
  Check,
  User,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import {
  BUDGETS,
  BODY_TYPES,
  COLORS,
  COLOR_SWATCH,
  FUEL_TYPES,
  KM_RANGES,
  OWNER_TYPES,
  RTO_OPTIONS,
  SEAT_OPTIONS,
  TRANSMISSIONS,
  YEAR_RANGES,
  PRICE_SLIDER,
  KM_SLIDER,
  budgetQuery,
  isBudgetActive,
  formatLakh,
  formatKmLabel,
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

function FilterCard({ title, icon: Icon, defaultOpen = false, activeCount = 0, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition"
      >
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            activeCount > 0 ? 'bg-[#3083ff]/10 text-[#3083ff]' : 'bg-slate-100 text-slate-500'
          }`}>
            <Icon className="w-4 h-4" strokeWidth={2.2} />
          </span>
        )}
        <span className="flex-1 text-[13px] font-bold text-slate-800">{title}</span>
        {activeCount > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#3083ff] text-white text-[10px] font-black leading-[18px] text-center">
            {activeCount}
          </span>
        )}
        {open ? <Minus className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

function FilterCheck({ checked }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border-[1.5px] shrink-0 transition-all duration-150 ${
        checked
          ? 'bg-[#3083ff] border-[#3083ff] shadow-[0_2px_6px_rgba(48,131,255,0.32)]'
          : 'bg-white border-slate-300 group-hover:border-[#3083ff]'
      }`}
      aria-hidden
    >
      <Check
        className={`w-3 h-3 text-white stroke-[3] transition-all duration-150 ${
          checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      />
    </span>
  );
}

function CheckRow({ checked, onChange, label, count, swatch, hint, mark }) {
  return (
    <label
      className={`flex items-center gap-2.5 py-1.5 px-1.5 -mx-1.5 rounded-lg cursor-pointer group transition-colors ${
        checked ? 'bg-[#3083ff]/[0.06]' : 'hover:bg-slate-50'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <FilterCheck checked={checked} />
      {swatch && (
        <span
          className={`w-4 h-4 rounded-full shrink-0 ring-1 ring-inset ${
            checked ? 'ring-[#3083ff]/40' : 'ring-black/10'
          }`}
          style={{ backgroundColor: swatch }}
        />
      )}
      {mark && <span className={`shrink-0 ${checked ? 'text-[#3083ff]' : 'text-slate-400'}`}>{mark}</span>}
      <span className={`flex-1 text-[13px] truncate ${checked ? 'font-semibold text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
        {label}
        {hint && <span className="block text-[11px] font-medium text-slate-400">{hint}</span>}
      </span>
      {count != null && count !== '' && (
        <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{count}</span>
      )}
    </label>
  );
}

function BodyMark({ type }) {
  const paths = {
    Hatchback: 'M3 14h18l-1.5-5.5A3 3 0 0 0 16.6 6.5H8.2A3 3 0 0 0 5.4 8.6L3 14Zm2.2 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm13.6 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z',
    Sedan: 'M2.5 14h19l-1.2-4.2A2.8 2.8 0 0 0 17.6 7.6h-3.1L13 6.2A2.2 2.2 0 0 0 11.2 5.4H8.4A2.2 2.2 0 0 0 6.5 6.5L4 14Zm2.3 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm14.4 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z',
    SUV: 'M2 13.5h20l-1.4-5A3.2 3.2 0 0 0 17.5 6H7.2A3.2 3.2 0 0 0 4.1 8.4L2 13.5Zm2.6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm14.8 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z',
    MUV: 'M1.8 13.8h20.4l-1.2-4.4A3 3 0 0 0 18.1 7H6.6A3 3 0 0 0 3.7 9.3L1.8 13.8Zm2.5.1a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm7.6 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm7.8 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z',
    Luxury: 'M3 14.2h18l-1.6-5.4A3.1 3.1 0 0 0 16.4 6.4H8.3A3.1 3.1 0 0 0 5.4 8.6L3 14.2Zm2.3 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm13.4 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z',
    Convertible: 'M4 14.2h16l-1.2-3.8A8 8 0 0 0 12 7.2a8 8 0 0 0-6.8 3.2L4 14.2Zm1.8 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm12.4 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z',
  };
  return (
    <svg viewBox="0 0 24 22" className="w-6 h-4" fill="currentColor" aria-hidden>
      <path d={paths[type] || paths.Sedan} />
    </svg>
  );
}

function DualRange({ min, max, step, valueMin, valueMax, onCommit, formatMin, formatMax }) {
  const loBound = Number(min);
  const hiBound = Number(max);
  const lo = valueMin === '' || valueMin == null ? loBound : Math.min(hiBound, Math.max(loBound, Number(valueMin)));
  const hi = valueMax === '' || valueMax == null ? hiBound : Math.min(hiBound, Math.max(loBound, Number(valueMax)));
  const [draft, setDraft] = useState([lo, hi]);

  useEffect(() => {
    setDraft([lo, hi]);
  }, [lo, hi]);

  const [low, high] = draft[0] <= draft[1] ? draft : [draft[1], draft[0]];
  const span = hiBound - loBound || 1;
  const left = ((low - loBound) / span) * 100;
  const right = ((high - loBound) / span) * 100;

  const commit = (nextLow, nextHigh) => {
    const a = Math.min(nextLow, nextHigh);
    const b = Math.max(nextLow, nextHigh);
    onCommit(a <= loBound ? '' : a, b >= hiBound ? '' : b);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-[12px] font-bold text-slate-800 mb-1">
        <span>{formatMin(low)}</span>
        <span className="text-slate-400 font-semibold">to</span>
        <span>{formatMax(high)}</span>
      </div>
      <div className="filter-dual-range">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-slate-200" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[#3083ff]"
          style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
        />
        <input
          type="range"
          min={loBound}
          max={hiBound}
          step={step}
          value={low}
          aria-label="Minimum"
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), Math.max(loBound, high - step));
            setDraft([next, high]);
            commit(next, high);
          }}
        />
        <input
          type="range"
          min={loBound}
          max={hiBound}
          step={step}
          value={high}
          aria-label="Maximum"
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), Math.min(hiBound, low + step));
            setDraft([low, next]);
            commit(low, next);
          }}
        />
      </div>
    </div>
  );
}

function ShowMoreList({ items, limit = 6, render }) {
  const [more, setMore] = useState(false);
  const visible = more ? items : items.slice(0, limit);
  return (
    <div>
      <div>{visible.map(render)}</div>
      {items.length > limit && (
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="mt-1.5 text-[12px] font-bold text-[#3083ff] hover:underline"
        >
          {more ? 'Show less' : `+ ${items.length - limit} more`}
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
  const selectedColors = asList(filters.color);
  const selectedSeats = asList(filters.seats);
  const selectedRtos = asList(filters.rto);

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [popular, setPopular] = useState([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [rtoQuery, setRtoQuery] = useState('');

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

  const rtoList = useMemo(() => {
    const fromCities = cities
      .map((c) => ({ label: c.state ? `${c.name} (${c.state})` : c.name, value: c.name }))
      .filter((row) => row.value);
    const merged = [...RTO_OPTIONS];
    fromCities.forEach((row) => {
      if (!merged.some((r) => sameId(r.value, row.value))) merged.push(row);
    });
    const t = rtoQuery.trim().toLowerCase();
    if (!t) return merged;
    return merged.filter((r) => r.label.toLowerCase().includes(t) || r.value.toLowerCase().includes(t));
  }, [cities, rtoQuery]);

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
  const kmActiveCount = (filters.minKm || filters.maxKm) ? 1 : 0;
  const budgetActiveCount = (filters.minPrice || filters.maxPrice) ? 1 : 0;

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="sticky top-0 z-10 space-y-2 bg-slate-50/95 backdrop-blur-sm pb-1">
          <div className="flex items-center justify-between px-0.5 py-1">
            <h3 className="text-sm font-black text-slate-900">Filters</h3>
            {onClear && (
              <button type="button" onClick={onClear} className="text-[12px] font-bold text-[#3083ff] hover:underline">
                Clear all
              </button>
            )}
          </div>
          {canSave && onSaveSearch && (
            <button
              type="button"
              onClick={onSaveSearch}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#3083ff] text-white font-black rounded-xl py-2.5 text-xs shadow-lg shadow-blue-500/20 hover:brightness-110 transition"
            >
              <BookmarkPlus className="w-3.5 h-3.5" strokeWidth={2.4} />
              Save this search
            </button>
          )}
        </div>
      )}

      {compact && canSave && onSaveSearch && (
        <button
          type="button"
          onClick={onSaveSearch}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#3083ff] text-white font-black rounded-xl py-2.5 text-xs"
        >
          <BookmarkPlus className="w-3.5 h-3.5" strokeWidth={2.4} />
          Save this search
        </button>
      )}

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
          placeholder="Search brand or model"
          className="w-full border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-[13px] bg-white text-slate-900 outline-none focus:ring-2 focus:ring-[#3083ff]/30 focus:border-[#3083ff]"
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

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <FilterCard title="Budget" icon={IndianRupee} activeCount={budgetActiveCount} defaultOpen>
          <DualRange
            min={PRICE_SLIDER.min}
            max={PRICE_SLIDER.max}
            step={PRICE_SLIDER.step}
            valueMin={filters.minPrice}
            valueMax={filters.maxPrice}
            formatMin={(v) => formatLakh(v)}
            formatMax={(v) => formatLakh(v, { plus: true })}
            onCommit={(minPrice, maxPrice) => patch({ minPrice, maxPrice })}
          />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Popular ranges</p>
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
                    const next = budgetQuery(b);
                    patch({
                      minPrice: active ? '' : (next.minPrice || ''),
                      maxPrice: active ? '' : (next.maxPrice || ''),
                    });
                  }}
                />
              );
            }}
          />
        </FilterCard>

        <FilterCard title="Brand & model" icon={Car} activeCount={selectedBrands.length + selectedModels.length} defaultOpen>
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

        <FilterCard title="Model year" icon={Calendar} activeCount={yearActiveCount}>
          {YEAR_RANGES.map(([label, params]) => (
            <CheckRow
              key={label}
              checked={isBucketActive(params, 'minYear', 'maxYear', filters)}
              label={label}
              onChange={() => toggleBucket('minYear', 'maxYear', params)}
            />
          ))}
        </FilterCard>

        <FilterCard title="Kilometers" icon={Gauge} activeCount={kmActiveCount} defaultOpen>
          <DualRange
            min={KM_SLIDER.min}
            max={KM_SLIDER.max}
            step={KM_SLIDER.step}
            valueMin={filters.minKm}
            valueMax={filters.maxKm}
            formatMin={(v) => formatKmLabel(v)}
            formatMax={(v) => formatKmLabel(v, { plus: true })}
            onCommit={(minKm, maxKm) => patch({ minKm, maxKm })}
          />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Popular ranges</p>
          {KM_RANGES.map(([label, params]) => (
            <CheckRow
              key={label}
              checked={isBucketActive(params, 'minKm', 'maxKm', filters)}
              label={label}
              onChange={() => toggleBucket('minKm', 'maxKm', params)}
            />
          ))}
        </FilterCard>

        <FilterCard title="Fuel type" icon={Fuel} activeCount={selectedFuels.length} defaultOpen>
          {FUEL_TYPES.map((fuel) => (
            <CheckRow
              key={fuel}
              checked={selectedFuels.some((v) => sameId(v, fuel))}
              label={fuel}
              onChange={() => toggleCsv('fuel', fuel)}
            />
          ))}
        </FilterCard>

        <FilterCard title="Transmission" icon={Settings2} activeCount={selectedTransmissions.length}>
          {TRANSMISSIONS.map((t) => (
            <CheckRow
              key={t}
              checked={selectedTransmissions.some((v) => sameId(v, t))}
              label={t}
              onChange={() => toggleCsv('transmission', t)}
            />
          ))}
        </FilterCard>

        <FilterCard title="Body type" icon={Car} activeCount={selectedBodies.length}>
          {BODY_TYPES.map((t) => (
            <CheckRow
              key={t}
              checked={selectedBodies.some((v) => sameId(v, t))}
              label={t}
              mark={<BodyMark type={t} />}
              onChange={() => toggleCsv('bodyType', t)}
            />
          ))}
        </FilterCard>

        <FilterCard title="Seats" icon={Armchair} activeCount={selectedSeats.length}>
          {SEAT_OPTIONS.map((row) => (
            <CheckRow
              key={row.value}
              checked={selectedSeats.some((v) => sameId(v, row.value))}
              label={row.label}
              onChange={() => toggleCsv('seats', row.value)}
            />
          ))}
        </FilterCard>

        <FilterCard title="Colors" icon={Palette} activeCount={selectedColors.length}>
          {COLORS.map((color) => (
            <CheckRow
              key={color}
              checked={selectedColors.some((v) => sameId(v, color))}
              label={color}
              swatch={COLOR_SWATCH[color]}
              onChange={() => toggleCsv('color', color)}
            />
          ))}
        </FilterCard>

        <FilterCard title="RTO" icon={Landmark} activeCount={selectedRtos.length}>
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={rtoQuery}
              onChange={(e) => setRtoQuery(e.target.value)}
              placeholder="Search RTO or city"
              className="w-full border border-slate-200 rounded-lg pl-8 py-2 text-[13px] bg-white outline-none focus:ring-2 focus:ring-[#3083ff]/30 focus:border-[#3083ff]"
            />
          </div>
          <ShowMoreList
            items={rtoList}
            limit={8}
            render={(row) => (
              <CheckRow
                key={row.value}
                checked={selectedRtos.some((v) => sameId(v, row.value))}
                label={row.label}
                onChange={() => toggleCsv('rto', row.value)}
              />
            )}
          />
        </FilterCard>

        <FilterCard title="Ownership" icon={User} activeCount={selectedOwners.length}>
          {OWNER_TYPES.map(([label, params]) => (
            <CheckRow
              key={label}
              checked={selectedOwners.some((v) => String(v) === String(params.ownership))}
              label={label}
              onChange={() => toggleCsv('ownership', params.ownership)}
            />
          ))}
        </FilterCard>

        <FilterCard title="City" icon={MapPin} activeCount={selectedCity ? 1 : 0}>
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
          <FilterCard title="Popular localities" icon={MapPin} activeCount={selectedAreas.filter((a) => popular.some((p) => p.name === a)).length}>
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
          <FilterCard title="Locality / Area" icon={MapPin} activeCount={selectedAreas.length}>
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
      </div>
    </div>
  );
}
