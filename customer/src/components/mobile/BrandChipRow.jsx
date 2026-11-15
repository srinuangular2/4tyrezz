import { useVehicleBrands } from '../../hooks/useVehicleCatalog';
import { mediaUrl } from '../../pages/profile/hubUtils';

function brandName(brand) {
  return typeof brand === 'string' ? brand : brand?.name || '';
}

export default function BrandChipRow({ onSelect, accent = '#3083ff' }) {
  const { brands, loading } = useVehicleBrands();
  const rows = (brands || [])
    .map((brand) => (typeof brand === 'string' ? { name: brand, logo: '' } : brand))
    .filter((brand) => brandName(brand))
    .slice(0, 8);

  if (loading && !rows.length) {
    return <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />;
  }

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {rows.map((brand) => {
        const name = brandName(brand);
        const logo = brand.logo ? mediaUrl(brand.logo) : '';
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2"
          >
            {logo ? (
              <img src={logo} alt="" className="h-5 w-5 object-contain" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: accent }}>
                {name.slice(0, 1)}
              </span>
            )}
            <span className="max-w-[7.5rem] truncate text-[12px] font-semibold text-slate-800">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
