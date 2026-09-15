import { useNavigate } from 'react-router-dom';
import useReferenceData from '../hooks/useReferenceData';
import {
  PRICE_RANGES, FUEL_TYPES, TRANSMISSIONS, BODY_TYPES,
  YEAR_RANGES, KM_RANGES, OWNER_TYPES, COLORS,
} from '../utils/filterOptions';
import {
  PriceIcon, BrandIcon, FuelIcon, TransmissionIcon, BodyIcon,
  YearIcon, KmIcon, OwnerIcon, ColorIcon, LocationIcon,
} from './icons';

export default function ExploreMegaMenu({ onNavigate }) {
  const navigate = useNavigate();
  const { brands, cities } = useReferenceData();

  const go = (params) => {
    const search = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    );
    navigate(`/cars?${search.toString()}`);
    onNavigate?.();
  };

  const columns = [
    { title: 'Price Range', icon: PriceIcon, items: PRICE_RANGES.map(([label, p]) => [label, () => go(p)]) },
    { title: 'Brand', icon: BrandIcon, items: brands.slice(0, 8).map((b) => [b.name, () => go({ brand: b._id })]) },
    { title: 'Fuel Type', icon: FuelIcon, items: FUEL_TYPES.map((f) => [f, () => go({ fuel: f })]) },
    { title: 'Transmission', icon: TransmissionIcon, items: TRANSMISSIONS.map((t) => [t, () => go({ transmission: t })]) },
    { title: 'Body Type', icon: BodyIcon, items: BODY_TYPES.map((t) => [t, () => go({ bodyType: t })]) },
    { title: 'Model Year', icon: YearIcon, items: YEAR_RANGES.map(([label, p]) => [label, () => go(p)]) },
    { title: 'Kilometers Driven', icon: KmIcon, items: KM_RANGES.map(([label, p]) => [label, () => go(p)]) },
    { title: 'Owner Type', icon: OwnerIcon, items: OWNER_TYPES.map(([label, p]) => [label, () => go(p)]) },
    { title: 'Color', icon: ColorIcon, items: COLORS.map((c) => [c, () => go({ color: c })]) },
    { title: 'City / Location', icon: LocationIcon, items: cities.slice(0, 8).map((c) => [c.name, () => go({ city: c._id })]) },
  ];

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white text-ink rounded-2xl shadow-2xl border border-slate-100 p-6 w-[880px] max-w-[92vw] grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-6 animate-fadeUp z-50">
      {columns.map((col) => (
        <div key={col.title}>
          <div className="flex items-center gap-2 mb-2.5">
            <col.icon className="w-4 h-4 text-ember" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate2">{col.title}</span>
          </div>
          <ul className="space-y-1.5">
            {col.items.length === 0 && <li className="text-xs text-slate-300">—</li>}
            {col.items.map(([label, onClick]) => (
              <li key={label}>
                <button onClick={onClick} className="text-sm text-left hover:text-ember transition">{label}</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
