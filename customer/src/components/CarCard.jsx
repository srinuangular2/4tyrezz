import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from './icons';
import { formatPrice, formatKm } from '../utils/format';
import { toggleWishlist } from '../app/wishlistSlice';


export default function CarCard({ car }) {
  const dispatch = useDispatch();
  const wishlistIds = useSelector((s) => s.wishlist?.ids || []);
  const user = useSelector((s) => s.auth?.user);
  const wishlisted = wishlistIds.includes(car._id);
  const img = car.images?.[0];

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    dispatch(toggleWishlist(car._id));
  };

  const cityName = car.city?.name || car.cityName || car.city || 'Hyderabad';

  return (
    <Link
      to={`/cars/${car._id}`}
      className="relative block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col h-full [&:hover_img]:scale-105 [&:hover_h3]:text-red-600 [&:hover_.price-text]:text-red-600 [&:hover_.arrow-cta]:bg-red-600 [&:hover_.arrow-cta]:text-white [&:hover_.arrow-icon]:translate-x-0.5"
    >
      {/* Media Header */}
      <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0">
        {img ? (
          <img
            src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
            alt={car.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50">
            No Photo Available
          </div>
        )}

        {/* Top Floating Row: Badges & Wishlist */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {car.isFeatured && (
              <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                Featured
              </span>
            )}
            {car.year && (
              <span className="bg-white/95 backdrop-blur-md text-slate-900 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm border border-slate-200">
                {car.year}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWishlist}
            aria-label="Add to wishlist"
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-white hover:text-red-600 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Heart filled={wishlisted} className={wishlisted ? 'text-red-600 fill-current' : 'text-slate-500'} />
          </button>
        </div>

        {/* Bottom Floating Row: Inspection Score */}
        {car.inspectionScore && (
          <div className="absolute bottom-3 left-3 bg-emerald-950/90 backdrop-blur-md text-emerald-400 border border-emerald-800/60 text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{car.inspectionScore}/100 Inspected</span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Location Line */}
          <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold mb-1">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{cityName}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-1 transition-colors duration-200">
            {car.title}
          </h3>

          {/* Clean Horizontal Spec Strip */}
          <div className="mt-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-normal">Km:</span>
              <span>{formatKm(car.kmDriven)}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <span>{car.fuel || 'N/A'}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <span>{car.transmission || 'Manual'}</span>
            </div>
          </div>
        </div>

        {/* Footer: Price & CTA Arrow */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block -mb-0.5">Price</span>
            <span className="price-text font-black text-xl text-slate-900 tracking-tight transition-colors duration-200">
              {formatPrice(car.price)}
            </span>
          </div>

          <div className="arrow-cta w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-all duration-200">
            <span className="arrow-icon font-bold text-sm transition-transform duration-200">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}