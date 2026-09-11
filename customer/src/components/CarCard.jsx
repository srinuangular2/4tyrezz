// import { Link } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { Heart } from './icons';
// import { formatPrice, formatKm } from '../utils/format';
// import { toggleWishlist } from '../app/wishlistSlice';


// export default function CarCard({ car }) {
//   const dispatch = useDispatch();
//   const wishlistIds = useSelector((s) => s.wishlist?.ids || []);
//   const user = useSelector((s) => s.auth?.user);
//   const wishlisted = wishlistIds.includes(car._id);
//   const img = car.images?.[0];

//   const handleWishlist = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (!user) return;
//     dispatch(toggleWishlist(car._id));
//   };

//   const cityName = car.city?.name || car.cityName || car.city || 'Hyderabad';

//   return (
//     <Link
//       to={`/cars/${car._id}`}
//       className="relative block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col h-full [&:hover_img]:scale-105 [&:hover_h3]:text-blue-600 [&:hover_.price-text]:text-blue-600 [&:hover_.arrow-cta]:bg-blue-600 [&:hover_.arrow-cta]:text-white [&:hover_.arrow-icon]:translate-x-0.5"
//     >
//       {/* Media Header */}
//       <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0">
//         {img ? (
//           <img
//             src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
//             alt={car.title}
//             className="w-full h-full object-cover transition-transform duration-500 ease-out"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50">
//             No Photo Available
//           </div>
//         )}

//         {/* Top Floating Row: Badges & Wishlist */}
//         <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
//           <div className="flex items-center gap-1.5 pointer-events-auto">
//             {/* {car.isFeatured && (
//               <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
//                 Featured
//               </span>
//             )} */}
//             {car.year && (
//               <span className="bg-white/95 backdrop-blur-md text-slate-900 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm border border-slate-200">
//                 {car.year}
//               </span>
//             )}
//           </div>

//           <button
//             type="button"
//             onClick={handleWishlist}
//             aria-label="Add to wishlist"
//             className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-white hover:text-blue-600 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
//           >
//             <Heart filled={wishlisted} className={wishlisted ? 'text-blue-600 fill-current' : 'text-slate-500'} />
//           </button>
//         </div>

//         {/* Bottom Floating Row: Inspection Score */}
//         {/* {car.inspectionScore && (
//           <div className="absolute bottom-3 left-3 bg-emerald-950/90 backdrop-blur-md text-emerald-400 border border-emerald-800/60 text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
//             <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
//               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//             </svg>
//             <span>{car.inspectionScore}/100 Inspected</span>
//           </div>
//         )} */}
//       </div>

//       {/* Content Container */}
//       <div className="p-4 flex flex-col justify-between flex-1">
//         <div>
//           {/* Location Line */}
//           {/* <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold mb-1">
//             <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//             <span className="truncate">{cityName}</span>
//           </div> */}

//           {/* Title */}
//           <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-1 transition-colors duration-200">
//             {car.title}
//           </h3>

//           {/* Clean Horizontal Spec Strip */}
//           <div className="mt-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
//             <div className="flex items-center gap-1">
//               <span className="text-slate-400 font-normal">Km:</span>
//               <span>{formatKm(car.kmDriven)}</span>
//             </div>
//             <span className="text-slate-300">•</span>
//             <div className="flex items-center gap-1">
//               <span>{car.fuel || 'N/A'}</span>
//             </div>
//             <span className="text-slate-300">•</span>
//             <div className="flex items-center gap-1">
//               <span>{car.transmission || 'Manual'}</span>
//             </div>
//           </div>
//         </div>

//         {/* Footer: Price & CTA Arrow */}
//         <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
//           <div>
//             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block -mb-0.5">Price</span>
//             <span className="price-text font-bold text-xl text-slate-900 tracking-tight transition-colors duration-200">
//               {formatPrice(car.price)}
//             </span>
//           </div>

//           <div className="arrow-cta w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-all duration-200">
//             <span className="arrow-icon font-bold text-sm transition-transform duration-200">→</span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// }


// import { Link } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { Heart } from './icons';
// import { formatPrice, formatKm } from '../utils/format';
// import { toggleWishlist } from '../app/wishlistSlice';

// export default function CarCard({ car }) {
//   const dispatch = useDispatch();
//   const wishlistIds = useSelector((s) => s.wishlist?.ids || []);
//   const user = useSelector((s) => s.auth?.user);
//   const wishlisted = wishlistIds.includes(car._id);
//   const img = car.images?.[0];

//   const handleWishlist = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (!user) return;
//     dispatch(toggleWishlist(car._id));
//   };

//   const cityName = car.city?.name || car.cityName || car.city || 'Hyderabad';

//   return (
//     <Link
//       to={`/cars/${car._id}`}
//       className="group relative flex flex-col h-full bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300 overflow-hidden"
//     >
//       {/* Top Ambient Glow Effect on Hover */}
//       <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

//       {/* Media Header */}
//       <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0">
//         {img ? (
//           <img
//             src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
//             alt={car.title}
//             className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50">
//             No Photo Available
//           </div>
//         )}

//         {/* Gradient Overlay over Image */}
//         <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 pointer-events-none" />

//         {/* Top Badges & Glassmorphic Wishlist Button */}
//         <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
//           <div className="flex items-center gap-1.5 pointer-events-auto">
//             {car.isFeatured && (
//               <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider border border-white/10">
//                 ★ Featured
//               </span>
//             )}
//             {car.year && (
//               <span className="bg-white/80 backdrop-blur-md text-slate-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md border border-white/60">
//                 {car.year}
//               </span>
//             )}
//           </div>

//           <button
//             type="button"
//             onClick={handleWishlist}
//             aria-label="Add to wishlist"
//             className="pointer-events-auto w-8 h-8 rounded-full bg-white/70 backdrop-blur-md border border-white/60 flex items-center justify-center text-slate-700 hover:bg-white hover:text-blue-600 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
//           >
//             <Heart filled={wishlisted} className={wishlisted ? 'text-blue-600 fill-current' : 'text-slate-600'} />
//           </button>
//         </div>

//         {/* Bottom Floating Glass Badge: Inspection Score */}
//         {car.inspectionScore && (
//           <div className="absolute bottom-3 left-3 bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10">
//             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//             <span>{car.inspectionScore}/100 Inspected</span>
//           </div>
//         )}
//       </div>

//       {/* Content Container */}
//       <div className="p-4 flex flex-col justify-between flex-1 relative bg-gradient-to-b from-white/40 to-white/90">
//         <div>
//           {/* Location Line */}
//           <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium mb-1">
//             <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//             <span className="truncate">{cityName}</span>
//           </div>

//           {/* Title */}
//           <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors duration-200">
//             {car.title}
//           </h3>

//           {/* Frosted Spec Strip */}
//           <div className="mt-3 py-2 px-3 bg-slate-100/60 backdrop-blur-sm rounded-xl border border-slate-200/50 flex items-center justify-between text-xs font-bold text-slate-700 shadow-inner">
//             <span>{formatKm(car.kmDriven)}</span>
//             <span className="text-slate-300 font-normal">•</span>
//             <span>{car.fuel || 'N/A'}</span>
//             <span className="text-slate-300 font-normal">•</span>
//             <span>{car.transmission || 'Manual'}</span>
//           </div>
//         </div>

//         {/* Footer: Price & Interactive Arrow CTA */}
//         <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
//           <div>
//             <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block -mb-0.5">Price</span>
//             <span className="font-black text-xl text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors duration-200">
//               {formatPrice(car.price)}
//             </span>
//           </div>

//           <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:bg-blue-600 group-hover:shadow-blue-500/30 transition-all duration-300">
//             <span className="font-bold text-sm group-hover:translate-x-0.5 transition-transform duration-200">→</span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// }


import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from './icons';
import { formatPrice, formatKm } from '../utils/format';
import { toggleWishlist } from '../app/wishlistSlice';
import { addCompare } from '../lib/compareTray';
import { useAuthGuard } from './AuthGuardModal';
import toast from 'react-hot-toast';

export default function CarCard({ car }) {
  // --- EMI Calculator State ---
  const [tenureYears, setTenureYears] = useState(4);
  const [interestRate, setInterestRate] = useState(14.5);
  const [loanAmount, setLoanAmount] = useState(0); // If 0, defaults to 90% of car price

  const dispatch = useDispatch();
  const wishlistIds = useSelector((s) => s.wishlist?.ids || []);
  const { requireAuth } = useAuthGuard();
  const wishlisted = wishlistIds.includes(car._id);
  const img = car.images?.[0];

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      dispatch(toggleWishlist(car._id));
    });
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = addCompare(car);
    if (result.already) toast.success('Already in compare');
    else if (result.full) toast.error('Compare tray is full (4 cars)');
    else toast.success('Added to compare');
  };

  const cityName = [car.location?.area, car.location?.city || car.city?.name || car.cityName].filter(Boolean).join(', ') || car.city?.name || '';

  // --- Dynamic EMI Calculation ---
  const carPrice = car.price || 0;
  const currentLoan = loanAmount > 0 ? loanAmount : Math.round(carPrice * 0.9);
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  const calculatedEmi =
    currentLoan > 0 && monthlyRate > 0
      ? Math.round(
          (currentLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : 0;

  return (
    <Link
      to={`/cars/${car._id}`}
      className="group relative flex flex-col h-full bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_20px_40px_0_rgba(37,99,235,0.2)] hover:border-blue-500/50 transition-all duration-500 overflow-hidden"
    >
      {/* Top Radiant Blue Gradient Beam on Hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30" />

      {/* Media Box */}
      <div className="relative h-52 bg-slate-100 overflow-hidden shrink-0">
        {img ? (
          <img
            src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
            alt={car.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50">
            No Image Available
          </div>
        )}

        {/* Cinematic Dark Gradient Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

        {/* Floating Top Header Bar */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {car.year && (
              <span className="bg-white/70 backdrop-blur-md text-slate-900 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white/80">
                {car.year}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleCompare}
              aria-label="Add to compare"
              className="h-9 px-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 text-[10px] font-black uppercase tracking-wider text-slate-800 hover:bg-white hover:text-blue-600 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              VS
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              aria-label="Add to wishlist"
              className="w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center text-slate-700 hover:bg-white hover:text-blue-600 hover:scale-110 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              <Heart filled={wishlisted} className={wishlisted ? 'text-blue-600 fill-current' : 'text-slate-700'} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col justify-between flex-1 relative bg-gradient-to-b from-white/30 to-white/80 backdrop-blur-md">
        <div>
          {/* Title */}
          <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
            {car.title}
          </h3>

          {/* Spec Strip */}
          <div className="mt-3.5 py-2.5 px-3.5 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-600 shadow-inner group-hover:border-blue-200 transition-colors">
            <span>{formatKm(car.kmDriven)}</span>
            <span className="text-slate-300 font-normal">•</span>
            <span>{car.fuel || 'Petrol'}</span>
            <span className="text-slate-300 font-normal">•</span>
            <span>{car.transmission || 'Manual'}</span>
          </div>
        </div>

        {/* Footer: Price & EMI CTA */}
        <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex items-center justify-between">
          <div className="flex flex-col">
            {calculatedEmi > 0 && (
              <span className="text-[11px] font-medium text-slate-500 -mb-0.5">
                EMI from <strong className="font-bold text-blue-600">{formatPrice(calculatedEmi)}/mo</strong>
              </span>
            )}
            <span className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors duration-300">
              {formatPrice(carPrice)}
            </span>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:bg-blue-600 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:rotate-[-45deg]">
            <span className="font-black text-base">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}