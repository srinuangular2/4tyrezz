import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Car, ChevronLeft, Search as SearchIcon } from 'lucide-react';
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

const PHASES = [
  { id: 'brand', title: 'Select your car brand', hint: 'Tap a logo. Search if you do not see it.' },
  { id: 'year', title: 'Select the year', hint: 'Choose the year on the registration certificate.' },
  { id: 'model', title: 'Select the model', hint: 'Pick the model name, then the variant.' },
  { id: 'variant', title: 'Select the variant', hint: 'Pick the exact trim, or continue if you are not sure.' },
];

function useIsPhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setPhone(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return phone;
}

export default function BrandModelGrid({ state, patch, onReady, onClose, tone = 'light', mobileSheet = false }) {
  const dark = tone === 'dark';
  const phone = useIsPhone();
  const sheet = mobileSheet && phone;
  const [q, setQ] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const phase = state.manualPhase || 'brand';

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
    if (!state.fuel) return;
    if (fuelTypes.includes(state.fuel)) return;
    patch({ fuel: '' });
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

  const phaseIndex = Math.max(0, PHASES.findIndex((item) => item.id === phase));
  const phaseMeta = PHASES[phaseIndex] || PHASES[0];

  const goBack = () => {
    if (phase === 'year') patch({ manualPhase: 'brand' });
    else if (phase === 'model') patch({ manualPhase: 'year' });
    else if (phase === 'variant') patch({ manualPhase: 'model' });
    else onClose?.();
  };

  const jumpPhase = (id, index) => {
    if (index > phaseIndex) return;
    if (id === 'brand') patch({ manualPhase: 'brand', model: '', year: '', variant: '', fuel: '', transmission: '' });
    else if (id === 'year') patch({ manualPhase: 'year', model: '', variant: '', fuel: '', transmission: '' });
    else if (id === 'model') patch({ manualPhase: 'model', variant: '', fuel: '', transmission: '' });
  };

  useEffect(() => {
    if (!sheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  const picker = (
    <div className={sheet ? 'fixed inset-0 z-[80] flex flex-col bg-white' : 'space-y-5'}>
      {sheet && (
        <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <button type="button" onClick={goBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700" aria-label={phase === 'brand' ? 'Close' : 'Back'}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#3083ff]">Step {phaseIndex + 1} of 4</p>
              <h3 className="truncate text-[16px] font-semibold text-slate-900">{phaseMeta.title}</h3>
            </div>
            <button type="button" onClick={onClose} className="text-[12px] font-semibold text-slate-500">Close</button>
          </div>
          <p className="mt-2 text-[12px] font-normal leading-snug text-slate-500">{phaseMeta.hint}</p>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {PHASES.map((item, index) => {
              const on = index === phaseIndex;
              const done = index < phaseIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={index > phaseIndex}
                  onClick={() => jumpPhase(item.id, index)}
                  className={`rounded-full px-1 py-1 text-[11px] font-semibold ${on ? 'bg-[#3083ff] text-white' : done ? 'bg-[#eaf2ff] text-[#1853ff]' : 'bg-slate-100 text-slate-400'}`}
                >
                  {item.id[0].toUpperCase() + item.id.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className={sheet ? 'min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4' : 'contents'}>
      <div className={`flex items-start justify-between gap-3 ${sheet ? 'hidden' : ''}`}>
        <div className="flex flex-wrap gap-2 min-w-0">
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
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`shrink-0 w-9 h-9 rounded-full border font-black ${dark ? 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
          >
            ✕
          </button>
        ) : null}
      </div>

      {phase === 'brand' && (
        <>
          <h3 className={`font-display font-black ${sheet ? 'hidden' : ''} ${dark ? 'text-white' : 'text-slate-900'}`}>Select your car brand</h3>
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
                    className={`rounded-2xl border p-3 text-center hover:border-blue-500 hover:shadow-md transition ${
                      dark ? 'bg-slate-950/50' : 'bg-white'
                    } ${
                      state.brand === b.name ? 'border-blue-500 ring-2 ring-blue-500/20' : dark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <BrandMark name={b.name} logo={b.logo} />
                    <p className={`mt-2 line-clamp-2 min-h-[2rem] text-[12px] font-semibold leading-tight ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{b.name}</p>
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
          <div className={`flex items-center justify-between ${sheet ? 'hidden' : ''}`}>
            <h3 className={`font-display font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Select registration year</h3>
            <button type="button" className="text-xs font-bold text-blue-400" onClick={() => patch({ manualPhase: 'brand' })}>
              ← Brands
            </button>
          </div>
          {sheet && <Search value={q} onChange={setQ} placeholder="Search year" />}
          {loadingYears ? (
            <LoaderGrid />
          ) : sheet ? (
            <div className="grid grid-cols-3 gap-3">
              {years.filter((y) => !q || String(y).includes(q)).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => pickYear(y)}
                  className={`flex flex-col items-center rounded-2xl border bg-white px-2 py-3 text-center transition hover:border-[#3083ff] ${
                    Number(state.year) === Number(y) ? 'border-[#3083ff] bg-[#f4f8ff]' : 'border-slate-200'
                  }`}
                >
                  <Calendar className="h-5 w-5 text-[#3083ff]" strokeWidth={1.75} />
                  <p className="mt-1.5 text-[14px] font-medium text-slate-800">{y}</p>
                </button>
              ))}
              {!years.length && (
                <p className="col-span-full text-sm font-medium text-slate-500">No registration years in the catalogue for this brand.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => pickYear(y)}
                  className={`rounded-xl border px-3 py-3 text-sm font-extrabold ${
                    Number(state.year) === Number(y)
                      ? 'bg-blue-600 text-white border-blue-500'
                      : dark
                        ? 'bg-slate-950/50 border-slate-800 text-slate-200 hover:border-blue-500'
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
          <div className={`flex items-center justify-between ${sheet ? 'hidden' : ''}`}>
            <h3 className={`font-display font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Select your car model</h3>
            <button type="button" className="text-xs font-bold text-blue-400" onClick={() => patch({ manualPhase: 'year' })}>
              ← Year
            </button>
          </div>
          <Search value={q} onChange={setQ} placeholder="Search model" />
          {loadingModels ? (
            <LoaderList />
          ) : sheet ? (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredModels.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => pickModel(name)}
                  className={`flex items-center gap-2.5 rounded-2xl border bg-white px-3 py-3 text-left transition hover:border-[#3083ff] ${
                    state.model === name ? 'border-[#3083ff] bg-[#f4f8ff]' : 'border-slate-200'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff]">
                    <Car className="h-4 w-4 text-[#3083ff]" strokeWidth={1.75} />
                  </span>
                  <span className="text-[13px] font-medium leading-tight text-slate-800">{name}</span>
                </button>
              ))}
              {filteredModels.length === 0 && (
                <p className="col-span-full text-sm font-medium text-slate-500">
                  No models for {state.brand} in {state.year}. Pick another year.
                </p>
              )}
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden max-h-[420px] overflow-y-auto ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
              {filteredModels.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => pickModel(name)}
                  className={`w-full text-left px-4 py-3.5 text-sm font-bold ${
                    dark ? 'text-slate-200 hover:bg-blue-500/10 hover:text-blue-300' : 'text-slate-800 hover:bg-[#EAF2FF] hover:text-[#1853ff]'
                  } ${
                    i ? (dark ? 'border-t border-slate-800' : 'border-t border-slate-100') : ''
                  } ${state.model === name ? (dark ? 'bg-blue-500/15 text-blue-300' : 'bg-[#EAF2FF] text-[#1853ff]') : ''}`}
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
          <div className={`flex items-center justify-between ${sheet ? 'hidden' : ''}`}>
            <h3 className={`font-display font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Select car variant</h3>
            <button type="button" className="text-xs font-bold text-blue-400" onClick={() => patch({ manualPhase: 'model' })}>
              ← Models
            </button>
          </div>
          {loadingMeta ? (
            <LoaderList />
          ) : (
            <>
              {fuelTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => patch({ fuel: '' })}
                    className={`rounded-full border px-4 py-2 text-xs font-extrabold ${
                      !state.fuel
                        ? 'bg-blue-600 text-white border-blue-500'
                        : dark
                          ? 'bg-slate-950/50 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    All
                  </button>
                  {fuelTypes.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => patch({ fuel: f })}
                      className={`rounded-full border px-4 py-2 text-xs font-extrabold ${
                        state.fuel === f
                          ? 'bg-blue-600 text-white border-blue-500'
                          : dark
                            ? 'bg-slate-950/50 border-slate-800 text-slate-300'
                            : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
              <Search value={variantSearch} onChange={setVariantSearch} placeholder="Search variant" />
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {state.fuel ? `${state.fuel} variants` : 'All variants'}
              </p>
              {loadingVariants ? (
                <LoaderList />
              ) : sheet ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {variants.map((v) => {
                    const label = v.variant || v.name;
                    const selected = variantMatches(v, state.variant, state.transmission);
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
                        className={`flex items-center gap-2.5 rounded-2xl border bg-white px-3 py-3 text-left transition hover:border-[#3083ff] ${
                          selected ? 'border-[#3083ff] bg-[#f4f8ff]' : 'border-slate-200'
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff]">
                          <Car className="h-4 w-4 text-[#3083ff]" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium leading-tight text-slate-800">{label}</span>
                          {v.fuelType ? <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{v.fuelType}</span> : null}
                        </span>
                      </button>
                    );
                  })}
                  {!variants.length && (
                    <p className="col-span-full text-sm font-medium text-slate-500">
                      No listed trims for this year. Continue if you are not sure of the variant.
                    </p>
                  )}
                </div>
              ) : (
                <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
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
                        className={`w-full text-left px-4 py-3.5 text-sm font-bold ${
                          dark ? 'hover:bg-blue-500/10' : 'hover:bg-[#EAF2FF]'
                        } ${
                          i ? (dark ? 'border-t border-slate-800' : 'border-t border-slate-100') : ''
                        } ${
                          variantMatches(v, state.variant, state.transmission)
                            ? dark ? 'bg-blue-500/15 text-blue-300' : 'bg-[#EAF2FF] text-[#1853ff]'
                            : dark ? 'text-slate-200' : 'text-slate-800'
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
                className={`w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3.5 text-xs font-black uppercase tracking-wider ${sheet ? 'hidden' : ''}`}
              >
                Continue
              </button>
              <button type="button" onClick={() => onReady?.()} className={`w-full text-xs font-bold text-blue-400 py-2 ${sheet ? 'hidden' : ''}`}>
                {state.variant ? 'Keep this variant and continue' : 'I don’t know my variant'}
              </button>
            </>
          )}
        </>
      )}
      </div>
      {sheet && phase === 'variant' && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onReady?.()}
            disabled={!state.year || !state.model}
            className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {state.variant ? 'Continue' : 'Continue without variant'}
          </button>
        </div>
      )}
    </div>
  );

  if (sheet && typeof document !== 'undefined') return createPortal(picker, document.body);
  return picker;
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
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 pl-10 pr-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
      />
    </label>
  );
}

function Chip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-200"
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
