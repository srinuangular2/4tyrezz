import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Check, ChevronLeft, Heart, ShoppingCart } from 'lucide-react';
import { useAuthGuard } from '../AuthGuardModal';
import { readCart, subscribeCart } from '../../lib/cart';
import AccountAvatar from '../AccountAvatar';

const STRIPES = {
  backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.08) 22px 44px)',
};

export default function LeadHero({
  kicker,
  title,
  accent,
  points = [],
  badge,
  subtitle,
  image,
  imageAlt = '',
  imageClass = 'h-[104px] w-[42%] object-contain object-center',
}) {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const signedIn = user?.role === 'customer';
  const wishlistCount = useSelector((s) => s.wishlist?.ids?.length || 0);
  const { requireAuth } = useAuthGuard();
  const [cartCount, setCartCount] = useState(() => readCart().length);

  useEffect(() => subscribeCart((rows) => setCartCount(rows.length)), []);

  const back = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const openAccount = (event, path) => {
    if (signedIn) return;
    event.preventDefault();
    requireAuth(() => navigate(path));
  };

  return (
    <section className="relative overflow-hidden bg-[#3083ff] px-3 pb-12 pt-[max(10px,env(safe-area-inset-top))] text-white lg:hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={STRIPES} />
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={back}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">{kicker}</p>
        <div className="flex shrink-0 items-center">
          <Link
            to={signedIn ? '/profile/wishlist' : '/'}
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
            to={signedIn ? '/profile/cart' : '/'}
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
            to={signedIn ? '/profile' : '/'}
            onClick={(event) => openAccount(event, '/profile')}
            className="flex h-8 w-8 items-center justify-center text-white"
            aria-label="Profile"
          >
            <AccountAvatar user={signedIn ? user : null} tone="white" className="h-7 w-7 text-[12px]" />
          </Link>
        </div>
      </div>
      <h1 className={`relative z-10 mt-2.5 text-[15px] font-semibold ${subtitle ? 'leading-snug' : 'whitespace-nowrap leading-none'}`}>
        {title}{accent ? ` ${accent}` : ''}
      </h1>
      {subtitle ? <p className="relative z-10 mt-1.5 line-clamp-1 text-[12px] font-normal leading-snug text-white/90">{subtitle}</p> : null}
      <div className="relative mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <ul className="space-y-1">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-1.5 text-[12px] font-medium text-white/95">
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                {point}
              </li>
            ))}
          </ul>
          {badge ? (
            <p className="mt-2.5 inline-flex rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">
              {badge}
            </p>
          ) : null}
        </div>
        <img
          src={image}
          alt={imageAlt}
          className={`pointer-events-none shrink-0 ${imageClass}`}
        />
      </div>
    </section>
  );
}
