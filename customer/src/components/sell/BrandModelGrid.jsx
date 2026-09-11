import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Skeleton } from '../PageShell';
import {
  useVehicleBrands,
  useVehicleFuelTransmissions,
  useVehicleModels,
  useVehicleVariants,
} from '../../hooks/useVehicleCatalog';

export default function BrandModelGrid({ state, patch, onReady }) {
  const [q, setQ] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const phase = state.manualPhase;

  const { brands, loading: loadingBrands } = useVehicleBrands();
  const { models, loading: loadingModels } = useVehicleModels(state.brand);
  const { fuelTypes, transmissions, years, bodyTypes, loading: loadingMeta } = useVehicleFuelTransmissions(
    state.brand,
    state.model
  );
  const { variants, loading: loadingVariants } = useVehicleVariants({
    brand: state.brand,
    model: state.model,
    fuelType: state.fuel,
    transmission: state.transmission,
    search: phase === 'variant' ? debouncedSearch : '',
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(variantSearch.trim()), 200);
    return () => clearTimeout(t);
  }, [variantSearch]);

  useEffect(() => {
    if (!fuelTypes.length) return;
    if (state.fuel && fuelTypes.includes(state.fuel)) return;
    patch({ fuel: fuelTypes[0] });
  }, [fuelTypes, state.fuel, patch]);

  useEffect(() => {
    if (bodyTypes[0] && !state.bodyType) patch({ bodyType: bodyTypes[0] });
  }, [bodyTypes, patch, state.bodyType]);

  const brandNames = useMemo(
    () => brands.map((b) => (typeof b === 'string' ? b : b.name)).filter(Boolean),
    [brands]
  );
  const modelNames = useMemo(
    () => models.map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean),
    [models]
  );

  const filteredBrands = q
    ? brandNames.filter((name) => name.toLowerCase().includes(q.toLowerCase()))
    : brandNames;
  const filteredModels = q
    ? modelNames.filter((name) => name.toLowerCase().includes(q.toLowerCase()))
    : modelNames;

  const pickBrand = (name) => {
    patch({
      brand: name,
      brandId: '',
      brandLogo: '',
      model: '',
      modelId: '',
      variant: '',
      fuel: '',
      transmission: '',
      manualPhase: 'model',
    });
    setQ('');
  };

  const pickModel = (name) => {
    patch({
      model: name,
      modelId: '',
      variant: '',
      fuel: '',
      transmission: '',
      manualPhase: 'year',
    });
    setQ('');
    setVariantSearch('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {state.brand && (
          <Chip onClick={() => patch({ manualPhase: 'brand', model: '', variant: '', fuel: '', transmission: '' })}>
            {state.brand}
          </Chip>
        )}
        {state.model && (
          <Chip onClick={() => patch({ manualPhase: 'model', variant: '', fuel: '', transmission: '' })}>{state.model}</Chip>
        )}
        {state.year && phase !== 'brand' && phase !== 'model' && (
          <Chip onClick={() => patch({ manualPhase: 'year' })}>{state.year}</Chip>
        )}
        {state.fuel && phase === 'variant' && <Chip>{state.fuel}</Chip>}
        {state.city && <Chip>{state.city}</Chip>}
      </div>

      {phase === 'brand' && (
        <>
          <Search value={q} onChange={setQ} placeholder="Search brand" />
          {loadingBrands ? (
            <LoaderGrid />
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {filteredBrands.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pickBrand(name)}
                    className={`rounded-2xl border bg-white p-3 text-center hover:border-[#3083ff] hover:shadow-md transition ${
                      state.brand === name ? 'border-[#3083ff] ring-2 ring-[#3083ff]/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="h-10 w-full rounded-xl bg-slate-50 flex items-center justify-center text-sm font-black text-[#3083ff]">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-[11px] font-extrabold text-slate-800 mt-2 truncate">{name}</p>
                  </button>
                ))}
              </div>
              {!filteredBrands.length && (
                <p className="text-sm font-medium text-slate-500">No brands in the database yet. Run npm run seed:vehicles.</p>
              )}
            </>
          )}
        </>
      )}

      {phase === 'model' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-900">Select your car model</h3>
            <button type="button" className="text-xs font-bold text-[#3083ff]" onClick={() => patch({ manualPhase: 'brand' })}>
              ← Brands
            </button>
          </div>
          <Search value={q} onChange={setQ} placeholder="Search model" />
          {loadingModels ? (
            <LoaderList />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden max-h-[420px] overflow-y-auto">
              {filteredModels.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => pickModel(name)}
                  className={`w-full text-left px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-[#EAF2FF] hover:text-[#1853ff] ${
                    i ? 'border-t border-slate-100' : ''
                  }`}
                >
                  {name}
                </button>
              ))}
              {filteredModels.length === 0 && (
                <p className="px-4 py-8 text-sm font-medium text-slate-500">No models for this brand in the database.</p>
              )}
            </div>
          )}
        </>
      )}

      {phase === 'year' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-900">Registration year</h3>
            <button type="button" className="text-xs font-bold text-[#3083ff]" onClick={() => patch({ manualPhase: 'model' })}>
              ← Models
            </button>
          </div>
          {loadingMeta ? (
            <LoaderGrid />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => patch({ year: y, manualPhase: 'variant' })}
                  className={`rounded-xl border px-3 py-3 text-sm font-extrabold ${
                    Number(state.year) === Number(y)
                      ? 'bg-[#3083ff] text-white border-[#3083ff]'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-[#3083ff]'
                  }`}
                >
                  {y}
                </button>
              ))}
              {!years.length && (
                <p className="col-span-full text-sm font-medium text-slate-500">No years stored for this model.</p>
              )}
            </div>
          )}
        </>
      )}

      {phase === 'variant' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-900">Select car variant</h3>
            <button type="button" className="text-xs font-bold text-[#3083ff]" onClick={() => patch({ manualPhase: 'year' })}>
              ← Year
            </button>
          </div>
          {loadingMeta ? (
            <LoaderList />
          ) : (
            <>
              {fuelTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fuelTypes.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => patch({ fuel: f })}
                      className={`rounded-full border px-4 py-2 text-xs font-extrabold ${
                        state.fuel === f ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
              {transmissions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => patch({ transmission: '' })}
                    className={`rounded-full border px-4 py-2 text-xs font-extrabold ${
                      !state.transmission ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    All
                  </button>
                  {transmissions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => patch({ transmission: t })}
                      className={`rounded-full border px-4 py-2 text-xs font-extrabold ${
                        state.transmission === t ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <Search value={variantSearch} onChange={setVariantSearch} placeholder="Search variant" />
              {state.fuel && (
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{state.fuel} variants</p>
              )}
              {loadingVariants ? (
                <LoaderList />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  {variants.map((v, i) => {
                    const label = v.variant || v.name;
                    return (
                      <button
                        key={v._id || `${label}-${v.fuelType}-${v.transmission}`}
                        type="button"
                        onClick={() => {
                          patch({
                            variant: label,
                            fuel: v.fuelType || state.fuel,
                            transmission: v.transmission || state.transmission,
                            bodyType: v.bodyType || state.bodyType,
                          });
                          onReady?.();
                        }}
                        className={`w-full text-left px-4 py-3.5 text-sm font-bold hover:bg-[#EAF2FF] ${
                          i ? 'border-t border-slate-100' : ''
                        } ${state.variant === label ? 'bg-[#EAF2FF] text-[#1853ff]' : 'text-slate-800'}`}
                      >
                        {label}
                        <span className="block text-[11px] font-semibold text-slate-400 mt-0.5">
                          {[v.fuelType, v.transmission].filter(Boolean).join(' · ')}
                        </span>
                      </button>
                    );
                  })}
                  {!variants.length && (
                    <p className="px-4 py-8 text-sm font-medium text-slate-500">No variants match these filters.</p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  patch({ variant: '' });
                  onReady?.();
                }}
                className="w-full text-xs font-bold text-[#3083ff] py-2"
              >
                I don’t know my variant
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Search({ value, onChange, placeholder }) {
  return (
    <label className="relative block">
      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-[#3083ff] focus:ring-2 focus:ring-[#3083ff]/20 shadow-sm"
      />
    </label>
  );
}

function Chip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-extrabold text-slate-700"
    >
      {children}
    </button>
  );
}

function LoaderGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((k) => (
        <Skeleton key={k} className="h-24" />
      ))}
    </div>
  );
}

function LoaderList() {
  return (
    <div className="space-y-2">
      {['a', 'b', 'c', 'd', 'e', 'f'].map((k) => (
        <Skeleton key={k} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}
