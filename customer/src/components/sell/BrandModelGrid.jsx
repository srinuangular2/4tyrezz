import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Skeleton } from '../PageShell';
import { mediaUrl } from '../../pages/profile/hubUtils';
import {
  useVehicleBrands,
  useVehicleFuelTransmissions,
  useVehicleModels,
  useVehicleVariants,
  useVehicleYears,
} from '../../hooks/useVehicleCatalog';
import { isAutomatic, variantMatches } from '../../lib/vehicleVariant';

export default function BrandModelGrid({ state, patch, onReady }) {
  const [q, setQ] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const phase = state.manualPhase;

  const { brands, loading: loadingBrands } = useVehicleBrands();
  const { years, loading: loadingYears } = useVehicleYears(state.brand);
  const { models, loading: loadingModels } = useVehicleModels(state.brand, state.year);
  const { fuelTypes, bodyTypes, loading: loadingMeta } = useVehicleFuelTransmissions(
    state.brand,
    state.model,
    state.year
  );
  const { variants, loading: loadingVariants } = useVehicleVariants({
    brand: state.brand,
    model: state.model,
    fuelType: state.fuel,
    search: phase === 'variant' ? debouncedSearch : '',
    year: state.year,
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

  const brandRows = useMemo(
    () =>
      (brands || [])
        .map((b) => (typeof b === 'string' ? { name: b, logo: '' } : b))
        .filter((b) => b.name),
    [brands]
  );
  const modelNames = useMemo(
    () => models.map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean),
    [models]
  );

  const filteredBrands = q
    ? brandRows.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()))
    : brandRows;
  const filteredModels = q
    ? modelNames.filter((name) => name.toLowerCase().includes(q.toLowerCase()))
    : modelNames;

  const pickBrand = (name, logo = '') => {
    patch({
      brand: name,
      brandId: '',
      brandLogo: logo,
      model: '',
      modelId: '',
      year: '',
      variant: '',
      fuel: '',
      transmission: '',
      manualPhase: 'year',
    });
    setQ('');
  };

  const pickYear = (y) => {
    patch({
      year: y,
      model: '',
      modelId: '',
      variant: '',
      fuel: '',
      transmission: '',
      manualPhase: 'model',
    });
    setQ('');
    setVariantSearch('');
  };

  const pickModel = (name) => {
    patch({
      model: name,
      modelId: '',
      variant: '',
      fuel: '',
      transmission: '',
      manualPhase: 'variant',
    });
    setQ('');
    setVariantSearch('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {state.brand && (
          <Chip onClick={() => patch({ manualPhase: 'brand', model: '', year: '', variant: '', fuel: '', transmission: '' })}>
            {state.brand}
          </Chip>
        )}
        {state.year && (
          <Chip onClick={() => patch({ manualPhase: 'year', model: '', variant: '', fuel: '', transmission: '' })}>
            {state.year}
          </Chip>
        )}
        {state.model && (
          <Chip onClick={() => patch({ manualPhase: 'model', variant: '', fuel: '', transmission: '' })}>{state.model}</Chip>
        )}
        {state.fuel && phase === 'variant' && <Chip>{state.fuel}</Chip>}
        {state.city && <Chip>{state.city}</Chip>}
      </div>

      {phase === 'brand' && (
        <>
          <h3 className="font-display font-black text-slate-900">Select your car brand</h3>
          <Search value={q} onChange={setQ} placeholder="Search brand" />
          {loadingBrands ? (
            <LoaderGrid />
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredBrands.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => pickBrand(b.name, b.logo)}
                    className={`rounded-2xl border bg-white p-3 text-center hover:border-[#3083ff] hover:shadow-md transition ${
                      state.brand === b.name ? 'border-[#3083ff] ring-2 ring-[#3083ff]/20' : 'border-slate-200'
                    }`}
                  >
                    <BrandMark name={b.name} logo={b.logo} />
                    <p className="text-[11px] font-extrabold text-slate-800 mt-2 truncate">{b.name}</p>
                  </button>
                ))}
              </div>
              {!filteredBrands.length && (
                <p className="text-sm font-medium text-slate-500">No brands in the catalogue yet.</p>
              )}
            </>
          )}
        </>
      )}

      {phase === 'year' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-900">Select registration year</h3>
            <button type="button" className="text-xs font-bold text-[#3083ff]" onClick={() => patch({ manualPhase: 'brand' })}>
              ← Brands
            </button>
          </div>
          {loadingYears ? (
            <LoaderGrid />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => pickYear(y)}
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
                <p className="col-span-full text-sm font-medium text-slate-500">
                  No registration years in the catalogue for this brand.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {phase === 'model' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-900">Select your car model</h3>
            <button type="button" className="text-xs font-bold text-[#3083ff]" onClick={() => patch({ manualPhase: 'year' })}>
              ← Year
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
                  } ${state.model === name ? 'bg-[#EAF2FF] text-[#1853ff]' : ''}`}
                >
                  {name}
                </button>
              ))}
              {filteredModels.length === 0 && (
                <p className="px-4 py-8 text-sm font-medium text-slate-500">
                  No models for {state.brand} in {state.year}. Pick another year.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {phase === 'variant' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-slate-900">Select car variant</h3>
            <button type="button" className="text-xs font-bold text-[#3083ff]" onClick={() => patch({ manualPhase: 'model' })}>
              ← Models
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
                    const auto = isAutomatic(v.transmission);
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
                        } ${
                          variantMatches(v, state.variant, state.transmission)
                            ? 'bg-[#EAF2FF] text-[#1853ff]'
                            : 'text-slate-800'
                        }`}
                      >
                        <span className="inline-flex flex-wrap items-center gap-2">
                          {label}
                          {auto && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              Automatic
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {!variants.length && (
                    <p className="px-4 py-8 text-sm font-medium text-slate-500">
                      No listed trims for this year. Continue if you are not sure of the variant.
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => onReady?.()}
                disabled={!state.year || !state.model}
                className="w-full rounded-xl bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white py-3.5 text-xs font-black uppercase tracking-wider"
              >
                Continue
              </button>
              <button type="button" onClick={() => onReady?.()} className="w-full text-xs font-bold text-[#3083ff] py-2">
                {state.variant ? 'Keep this variant and continue' : 'I don’t know my variant'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function BrandMark({ name, logo }) {
  const [failed, setFailed] = useState(false);
  const src = logo && !failed ? mediaUrl(logo) : '';
  if (src) {
    return (
      <div className="h-10 w-full rounded-xl bg-slate-50 flex items-center justify-center px-2">
        <img src={src} alt="" className="max-h-8 max-w-full object-contain" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className="h-10 w-full rounded-xl bg-slate-50 flex items-center justify-center text-sm font-black text-[#3083ff]">
      {String(name || '').slice(0, 2).toUpperCase()}
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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].map((k) => (
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
