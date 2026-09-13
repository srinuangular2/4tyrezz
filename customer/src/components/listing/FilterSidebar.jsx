import { useEffect, useState } from 'react';
import api from '../../api/axios';

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

export default function FilterSidebar({ filters, apply }) {
  const selectedCity = String(filters.city || '').trim();
  const selectedAreas = asList(filters.area);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [popular, setPopular] = useState([]);

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

  const cityOptions = cities;
  const toggleArea = (name) => {
    const next = selectedAreas.includes(name)
      ? selectedAreas.filter((a) => a !== name)
      : [...selectedAreas, name];
    apply({ ...filters, area: next.join(','), page: 1 });
  };

  return (
    <>
      <div className="pb-5 mb-5 border-b border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate2 mb-2">City</h4>
        <select
          value={filters.city || ''}
          onChange={(e) => apply({ ...filters, city: e.target.value, area: '', page: 1 })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900"
        >
          <option value="">All cities</option>
          {cityOptions.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}{c.state ? `, ${c.state}` : ''} {c.count ? `(${c.count})` : ''}
            </option>
          ))}
        </select>
      </div>

      {popular.length > 0 && (
        <div className="pb-5 mb-5 border-b border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate2 mb-2">Popular localities</h4>
          <div className="flex flex-wrap gap-2">
            {popular.map((row) => (
              <button
                key={row.name}
                type="button"
                onClick={() => toggleArea(row.name)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  selectedAreas.includes(row.name)
                    ? 'border-[#3083ff] bg-blue-50 text-[#3083ff]'
                    : 'border-slate-200 text-slate-700 hover:border-[#3083ff]'
                }`}
              >
                {row.name} {row.count ? `(${row.count})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {areas.length > 0 && (
        <div className="pb-5 mb-5 border-b border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate2 mb-2">Locality / Area</h4>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {areas.map((row) => (
              <label key={row.name} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAreas.includes(row.name)}
                  onChange={() => toggleArea(row.name)}
                  className="rounded border-slate-300 text-[#3083ff]"
                />
                <span className="flex-1 truncate">{row.name}</span>
                <span className="text-[11px] font-bold text-slate-400">{row.count || 0}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
