import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from './icons';
import { formatPrice, formatKm } from '../utils/format';
import { toggleWishlist } from '../app/wishlistSlice';

export default function CarCard({ car }) {
  const dispatch = useDispatch();
  const wishlistIds = useSelector((s) => s.wishlist.ids);
  const user = useSelector((s) => s.auth.user);
  const wishlisted = wishlistIds.includes(car._id);
  const img = car.images?.[0];

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) return;
    dispatch(toggleWishlist(car._id));
  };

  return (
    <Link
      to={`/cars/${car._id}`}
      className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-1.5 transition-all duration-300"
    >
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {img ? (
          <img src={img} alt={car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-gradient-to-br from-slate-50 to-slate-100">Photo coming soon</div>
        )}
        {car.isFeatured && (
          <span className="absolute top-3 left-3 bg-red-gradient text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">Featured</span>
        )}
        {/* {car.inspectionScore && (
          <div className="absolute -bottom-4 right-4 w-11 h-11 rounded-full bg-red-gradient text-white border-[3px] border-white flex items-center justify-center font-display font-extrabold text-sm shadow-lg">
            {car.inspectionScore}
          </div>
        )} */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center hover:bg-white hover:scale-110 transition shadow-sm"
        >
          <Heart filled={wishlisted} className={wishlisted ? 'text-ember' : 'text-slate-400'} />
        </button>
      </div>
      <div className="p-4 pt-6">
        <h3 className="text-[15px] leading-snug line-clamp-1 font-display">{car.title}</h3>
        <p className="font-display font-semibold text-brand-red text-lg mt-1.5">{formatPrice(car.price)}</p>
        <p className="text-xs text-slate2 mt-2">
          {car.year} <span className="mx-1.5 text-slate-300">•</span> {car.fuel} <span className="mx-1.5 text-slate-300">•</span> {formatKm(car.kmDriven)}
        </p>
        <p className="text-xs text-slate2 mt-1">
          {car.transmission} <span className="mx-1.5 text-slate-300">•</span> {car.city?.name}
        </p>
      </div>
    </Link>
  );
}
