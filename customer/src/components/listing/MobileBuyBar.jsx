import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowUpDown, Calendar, Car, ChevronLeft, Fuel, Gauge, Heart, IndianRupee, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import HeaderSearchBar from '../common/HeaderSearchBar';
import { useAuthGuard } from '../AuthGuardModal';
import { readCart, subscribeCart } from '../../lib/cart';
import AccountAvatar from '../AccountAvatar';

const CHIPS = [
  ['filters', 'Filters', SlidersHorizontal],
  ['sort', 'Sort by', ArrowUpDown],
  ['budget', 'Budget', IndianRupee],
  ['brand', 'Brand', Car],
  ['fuel', 'Fuel', Fuel],
  ['year', 'Year', Calendar],
  ['km', 'Kms', Gauge],
];

const STRIPES = {
  backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.08) 22px 44px)',
};

export default function MobileBuyBar({ onOpen, active = {}, total, loading }) {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const signedIn = user?.role === 'customer';
  const wishlistCount = useSelector((s) => s.wishlist?.ids?.length || 0);
  const { requireAuth } = useAuthGuard();
  const [cartCount, setCartCount] = useState(() => readCart().length);
  const promoRef = useRef(null);
  const barRef = useRef(null);
  const [stuck, setStuck] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => subscribeCart((rows) => setCartCount(rows.length)), []);

  useEffect(() => {
    const promo = promoRef.current;
    if (!promo) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setStuck(!entry.isIntersecting);
    });
    observer.observe(promo);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const measure = () => setBarHeight(bar.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const back = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const openAccount = (event, path) => {
    if (signedIn) return;
    event.preventDefault();
    requireAuth(() => navigate(path));
  };

  const tools = (
    <>
      <div className="px-3 pt-2">
        <HeaderSearchBar city="Hyderabad" showVoice />
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 py-2">
        {CHIPS.map(([id, label, Icon]) => {
          const on = id === 'filters' ? active.filters : active[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(id === 'filters' ? 'budget' : id)}
              className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold ${on ? 'border-white bg-white text-[#1853ff]' : 'border-white/35 bg-white/15 text-white'}`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="lg:hidden">
      <div className="relative bg-[#3083ff] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={STRIPES} />
        <div ref={promoRef} className="relative px-3 pb-1 pt-[max(10px,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center">
              <Link
                to={signedIn ? '/profile/wishlist' : '/cars'}
                onClick={(event) => openAccount(event, '/profile/wishlist')}
                className="relative flex h-8 w-8 items-center justify-center text-white"
                aria-label="Wishlist"
              >
                <Heart className="h-[18px] w-[18px]" />
                {signedIn && wishlistCount > 0 ? (
                  <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-0.5 text-[8px] font-bold text-[#1853ff]">{wishlistCount}</span>
                ) : null}
              </Link>
              <Link
                to={signedIn ? '/profile/cart' : '/cars'}
                onClick={(event) => openAccount(event, '/profile/cart')}
                className="relative flex h-8 w-8 items-center justify-center text-white"
                aria-label="Cart"
              >
                <ShoppingCart className="h-[18px] w-[18px]" />
                {signedIn && cartCount > 0 ? (
                  <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-0.5 text-[8px] font-bold text-[#1853ff]">{cartCount}</span>
                ) : null}
              </Link>
              <Link
                to={signedIn ? '/profile' : '/cars'}
                onClick={(event) => openAccount(event, '/profile')}
                className="flex h-8 w-8 items-center justify-center text-white"
                aria-label="Profile"
              >
                <AccountAvatar user={signedIn ? user : null} tone="white" className="h-7 w-7 text-[12px]" />
              </Link>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-semibold leading-snug">Buy certified cars</p>
              <p className="mt-1 text-[12px] leading-snug text-white/85">Inspected listings, with a clear price. You talk to 4tyrezz.</p>
            </div>
            <img src="/hero-car.png" alt="" className="h-[84px] w-[42%] max-w-[150px] shrink-0 object-contain object-right" />
          </div>
        </div>
        <div
          ref={barRef}
          className={stuck ? 'fixed inset-x-0 top-0 z-40 bg-[#3083ff] text-white shadow-md' : 'relative'}
        >
          {stuck ? <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={STRIPES} /> : null}
          <div className="relative">{tools}</div>
        </div>
        {stuck ? <div style={{ height: barHeight }} /> : null}
      </div>
      <p className="bg-slate-50 px-3 pb-1 pt-3 text-[13px] font-semibold text-slate-800">
        {loading ? 'Finding cars…' : `${total} used cars in Hyderabad`}
      </p>
    </div>
  );
}
