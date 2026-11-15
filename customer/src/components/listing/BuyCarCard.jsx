import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShieldCheck } from 'lucide-react';
import { formatKm, formatPrice } from '../../utils/format';
import { toggleWishlist } from '../../app/wishlistSlice';
import { useAuthGuard } from '../AuthGuardModal';
import { mediaUrl } from '../../pages/profile/hubUtils';

function emiFor(price) {
  const loan = Math.round(Number(price || 0) * 0.9);
  const rate = 14.5 / 12 / 100;
  const months = 48;
  if (!loan || !rate) return 0;
  return Math.round((loan * rate * (1 + rate) ** months) / ((1 + rate) ** months - 1));
}

export default function BuyCarCard({ car }) {
  const dispatch = useDispatch();
  const wishlistIds = useSelector((s) => s.wishlist?.ids || []);
  const { requireAuth } = useAuthGuard();
  const wishlisted = wishlistIds.includes(car._id);
  const img = car.images?.[0];
  const rawTitle = car.title || '';
  const year = car.year ? String(car.year) : '';
  const title = year && rawTitle.startsWith(year) ? rawTitle : [year, rawTitle].filter(Boolean).join(' ');
  const emi = emiFor(car.price);

  const wish = (event) => {
    event.preventDefault();
    event.stopPropagation();
    requireAuth(() => dispatch(toggleWishlist(car._id)));
  };

  return (
    <Link to={`/cars/${car._id}`} className="flex h-full min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
      <div className="relative flex h-[118px] w-full items-center justify-center overflow-hidden bg-[#f4f6f8]">
        {img ? (
          <img src={mediaUrl(img)} alt="" className="h-full max-h-full w-full max-w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-slate-400">No photo</div>
        )}
        <button
          type="button"
          onClick={wish}
          aria-label="Save car"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Heart className={`h-3.5 w-3.5 ${wishlisted ? 'fill-[#e11d48] text-[#e11d48]' : 'text-slate-500'}`} />
        </button>
        {car.inspectionScore ? (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#0e7a52]">
            <ShieldCheck className="h-3 w-3" />
            {car.inspectionScore}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-slate-900">{title}</h3>
        <p className="mt-1 truncate text-[10px] leading-snug text-slate-500">
          {formatKm(car.kmDriven)} · {car.fuel || 'Petrol'} · {car.transmission || 'Manual'}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold leading-tight text-slate-900">{formatPrice(car.price)}</p>
            {emi > 0 ? <p className="mt-0.5 truncate text-[10px] font-medium leading-tight text-[#9a5418]">EMI {formatPrice(emi)}/mo</p> : null}
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-lg bg-[#3083ff] px-2 py-1.5 text-[10px] font-semibold leading-none text-white">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}
