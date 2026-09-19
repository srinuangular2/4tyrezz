import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useReferenceData from '../hooks/useReferenceData';
import {
  PRICE_RANGES, FUEL_TYPES, TRANSMISSIONS, BODY_TYPES,
  YEAR_RANGES, KM_RANGES, OWNER_TYPES, COLORS,
} from '../utils/filterOptions';
import { Chevron } from './icons';

// Spinny-style secondary nav: each filter category is its own independent
// dropdown trigger in a row, rather than one big panel covering everything
// at once. Only one dropdown is open at a time.
export default function ExploreByBar() {
  const navigate = useNavigate();
  const { brands, cities } = useReferenceData();
  const [open, setOpen] = useState(null); // category key currently open, or null
  const barRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setOpen(null); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const go = (params) => {
    const search = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    );
    navigate(`/cars?${search.toString()}`);
    setOpen(null);
  };

  const categories = [
    { key: 'price', label: 'Price Range', items: PRICE_RANGES.map(([label, p]) => [label, () => go(p)]) },
    { key: 'brand', label: 'Make and Model', items: brands.slice(0, 12).map((b) => [b.name, () => go({ brand: b._id })]) },
    { key: 'year', label: 'Year', items: YEAR_RANGES.map(([label, p]) => [label, () => go(p)]) },
    { key: 'fuel', label: 'Fuel', items: FUEL_TYPES.map((f) => [f, () => go({ fuel: f })]) },
    { key: 'km', label: 'KM Driven', items: KM_RANGES.map(([label, p]) => [label, () => go(p)]) },
    { key: 'body', label: 'Body Type', items: BODY_TYPES.map((t) => [t, () => go({ bodyType: t })]) },
    { key: 'transmission', label: 'Transmission', items: TRANSMISSIONS.map((t) => [t, () => go({ transmission: t })]) },
    { key: 'owner', label: 'Owner Type', items: OWNER_TYPES.map(([label, p]) => [label, () => go(p)]) },
    { key: 'color', label: 'Color', items: COLORS.map((c) => [c, () => go({ color: c })]) },
    { key: 'city', label: 'City', items: cities.slice(0, 12).map((c) => [c.name, () => go({ city: c._id })]) },
  ];

  const services = [
    ['Sell', '/sell'],
    ['Valuation', '/valuation'],
    ['Finance', '/finance'],
    ['Insurance', '/insurance'],
    ['Offers', '/offers'],
    ['Compare', '/compare'],
  ];

  return (
    <div ref={barRef} className="hidden lg:block bg-ink border-t border-white/10">
      <div className="container-px flex items-center flex-wrap gap-1 min-h-[44px]">
        {/* <span className="text-white/40 text-xs font-bold uppercase tracking-wider pr-3 flex-shrink-0">Explore By</span> */}
        {categories.map((cat) => (
          <div
            key={cat.key}
            className="relative flex-shrink-0"
            onMouseEnter={() => setOpen(cat.key)}
            onMouseLeave={() => setOpen((o) => (o === cat.key ? null : o))}
          >
            <button
              onClick={() => setOpen(cat.key)}
              className={`flex items-center gap-1 px-3 h-11 text-sm font-semibold whitespace-nowrap transition ${open === cat.key ? 'text-ember' : 'text-white/80 hover:text-white'}`}
            >
              {cat.label} <Chevron className={open === cat.key ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            {open === cat.key && (
              <div className="absolute top-full left-0 bg-white text-ink rounded-xl shadow-2xl border border-slate-100 py-2 min-w-[200px] max-h-[70vh] overflow-y-auto animate-fadeUp z-50">
                {cat.items.length === 0 && <p className="px-4 py-2 text-xs text-slate-300">Nothing to show yet</p>}
                {cat.items.map(([label, onClick]) => (
                  <button
                    key={label} onClick={onClick}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-brand-gradient-soft hover:text-ember transition"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="ml-auto flex items-center gap-1 flex-shrink-0 pl-3 border-l border-white/10">
          {services.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 h-11 flex items-center text-sm font-semibold whitespace-nowrap transition ${
                  isActive ? 'text-ember' : 'text-white/80 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
