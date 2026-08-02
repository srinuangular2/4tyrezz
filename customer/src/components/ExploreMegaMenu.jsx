import { useNavigate } from 'react-router-dom';
import useReferenceData from '../hooks/useReferenceData';
import {
  PriceIcon, BrandIcon, FuelIcon, TransmissionIcon, BodyIcon,
  YearIcon, KmIcon, OwnerIcon, ColorIcon, LocationIcon,
} from './icons';

const PRICE_RANGES = [
  ['Under ₹3 Lakh', { maxPrice: 300000 }],
  ['₹3 – 5 Lakh', { minPrice: 300000, maxPrice: 500000 }],
  ['₹5 – 8 Lakh', { minPrice: 500000, maxPrice: 800000 }],
  ['₹8 – 10 Lakh', { minPrice: 800000, maxPrice: 1000000 }],
  ['₹10 – 15 Lakh', { minPrice: 1000000, maxPrice: 1500000 }],
  ['Above ₹15 Lakh', { minPrice: 1500000 }],
];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'];
const YEAR_RANGES = [
  ['2022 & newer', { minYear: 2022 }],
  ['2019 – 2021', { minYear: 2019, maxYear: 2021 }],
  ['2015 – 2018', { minYear: 2015, maxYear: 2018 }],
  ['Before 2015', { maxYear: 2014 }],
];
const KM_RANGES = [
  ['Under 20,000 km', { maxKm: 20000 }],
  ['20,000 – 40,000 km', { minKm: 20000, maxKm: 40000 }],
  ['40,000 – 60,000 km', { minKm: 40000, maxKm: 60000 }],
  ['60,000 – 80,000 km', { minKm: 60000, maxKm: 80000 }],
  ['Above 80,000 km', { minKm: 80000 }],
];
const OWNER_TYPES = [
  ['1st owner', { ownership: 1 }],
  ['2nd owner', { ownership: 2 }],
  ['3rd owner', { ownership: 3 }],
];
const COLORS = ['White', 'Silver', 'Red', 'Black', 'Grey'];

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
