import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Armchair,
  Calendar,
  Car,
  Clock,
  Fuel,
  Gauge,
  IndianRupee,
  Landmark,
  MapPin,
  Palette,
  Settings2,
  User,
  X,
} from 'lucide-react';
import FilterSidebar from './FilterSidebar';

const SECTIONS = [
  ['sort', 'Sort by', Clock],
  ['budget', 'Budget', IndianRupee],
  ['brand', 'Make & model', Car],
  ['year', 'Model year', Calendar],
  ['km', 'Kms driven', Gauge],
  ['fuel', 'Fuel', Fuel],
  ['transmission', 'Transmission', Settings2],
  ['body', 'Body type', Car],
  ['seats', 'Seats', Armchair],
  ['color', 'Color', Palette],
  ['rto', 'RTO', Landmark],
  ['ownership', 'Ownership', User],
  ['city', 'City', MapPin],
  ['area', 'Locality', MapPin],
];

const SORTS = [
  ['-createdAt', 'Newest first', Clock],
  ['price', 'Price: low to high', ArrowDown],
  ['-price', 'Price: high to low', ArrowUp],
  ['-year', 'Year: newest', Calendar],
];

const TITLES = Object.fromEntries(SECTIONS);

export default function MobileFilterSheet({
  open,
  initial = 'budget',
  onClose,
  onClear,
  sort,
  onSort,
  total,
  loading,
  filters,
  apply,
  brands,
  models,
}) {
  const [tab, setTab] = useState(initial || 'budget');

  useEffect(() => {
    if (open) setTab(initial || 'budget');
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-white lg:hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700" aria-label="Close filters">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-[16px] font-semibold text-slate-900">Filters</h2>
        <button type="button" onClick={onClear} className="text-[13px] font-semibold text-[#4f46e5]">Clear</button>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav className="w-[132px] shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
          {SECTIONS.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex w-full items-center gap-2 border-l-4 px-2.5 py-3 text-left text-[12px] leading-snug ${tab === id ? 'border-[#4f46e5] bg-[#eeecff] font-semibold text-[#4f46e5]' : 'border-transparent font-medium text-slate-600'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4 pb-24">
          <p className="text-[16px] font-semibold text-slate-900">{TITLES[tab]}</p>
          {tab === 'sort' ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SORTS.map(([value, label, Icon]) => {
                const on = (sort || '-createdAt') === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSort(value)}
                    className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-3 text-center ${on ? 'border-[#4f46e5] bg-[#eeecff] text-[#4f46e5]' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${on ? 'bg-white' : 'bg-slate-100'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3">
              <FilterSidebar
                section={tab}
                filters={filters}
                apply={apply}
                brands={brands}
                models={models}
                compact
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="w-[72px]">
          <p className="text-[16px] font-bold text-slate-900">{loading ? '…' : total}</p>
          <p className="text-[11px] text-slate-500">cars</p>
        </div>
        <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl bg-[#4f46e5] text-[14px] font-semibold text-white">
          Apply filter
        </button>
      </div>
    </div>
  );
}
