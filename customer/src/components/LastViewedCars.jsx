import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatKm } from '../utils/format';
import { mediaUrl } from '../pages/profile/hubUtils';
import { readRecentlyViewed, subscribeRecentlyViewed } from '../lib/recentlyViewed';

function CarTile({ car }) {
  return (
    <Link
      to={`/cars/${car.id}`}
      className="group relative shrink-0 w-[220px] bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_16px_32px_0_rgba(37,99,235,0.18)] hover:border-blue-500/40 transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="h-32 bg-slate-100 overflow-hidden">
        {car.thumb ? (
          <img
            src={mediaUrl(car.thumb)}
            alt={car.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-slate-400">
            No photo
          </div>
        )}
      </div>
      <div className="p-3.5">
        <p className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#3083ff] transition-colors">
          {car.title}
        </p>
        <p className="text-[11px] font-semibold text-slate-500 mt-1.5 truncate">
          {[car.km != null ? formatKm(car.km) : null, car.fuel, car.transmission].filter(Boolean).join(' | ')}
        </p>
        <p className="text-sm font-black text-slate-900 mt-2">{formatPrice(car.price)}</p>
        {car.city ? (
          <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate">{car.city}</p>
        ) : null}
      </div>
    </Link>
  );
}

export default function LastViewedCars() {
  const [items, setItems] = useState(readRecentlyViewed);
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => subscribeRecentlyViewed(setItems), []);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [items.length]);

  if (!items.length) return null;

  const nudge = (dir) => scrollerRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  return (
    <section className="py-16 bg-white">
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between pb-3 mb-5 border-b border-slate-100">
          <div>
            <p className="text-[14px] font-medium text-[#909294] uppercase tracking-[5px] font-display mb-3">
              Your activity
            </p>
            <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display">
              Last <span className="font-black text-slate-900">viewed cars</span>
            </h2>
          </div>
          <Link
            to="/cars"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-black hover:text-[#3083ff] transition-all group font-display uppercase tracking-wider mb-1"
          >
            <span>Explore more</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="relative">
          {canLeft && (
            <button
              type="button"
              aria-label="Previous cars"
              onClick={() => nudge(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] shadow-md flex items-center justify-center font-bold"
            >
              ‹
            </button>
          )}
          {canRight && (
            <button
              type="button"
              aria-label="Next cars"
              onClick={() => nudge(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] shadow-md flex items-center justify-center font-bold"
            >
              ›
            </button>
          )}
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((car) => (
              <CarTile key={car.id} car={car} />
            ))}
            <Link
              to="/cars"
              className="shrink-0 w-[180px] min-h-[220px] rounded-2xl border border-dashed border-[#3083ff]/40 bg-[#3083ff]/5 hover:bg-[#3083ff]/10 flex flex-col items-center justify-center gap-3 px-4 text-center transition-colors"
            >
              <span className="w-12 h-12 rounded-full bg-[#3083ff] text-white flex items-center justify-center text-xl font-black">
                →
              </span>
              <span className="text-sm font-extrabold text-slate-900">Explore more used cars</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
