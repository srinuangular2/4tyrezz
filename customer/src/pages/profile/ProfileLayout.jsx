import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Bell,
  BadgeCheck,
  ClipboardList,
  ClipboardCheck,
  Gauge,
  GitCompare,
  Heart,
  Landmark,
  Package,
  Search,
  Shield,
  ShoppingCart,
  User,
} from 'lucide-react';
import { logout } from '../../app/authSlice';
import { SHOW_TEST_DRIVE } from '../../lib/featureFlags';

const LINKS = [
  { to: '/profile/settings', label: 'My Profile', description: 'Your name, contact details and preferences', icon: User, emoji: '👤', tone: 'from-[#dbeafe] to-[#f4f9ff]' },
  { to: '/profile/orders', label: 'My Orders', description: 'Token bookings and car purchases', icon: Package, emoji: '🧾', tone: 'from-[#ffe8d6] to-[#fff6ee]' },
  { to: '/profile/my-vehicles', label: 'My Vehicles', description: 'Cars you are selling, photos and edits', icon: BadgeCheck, emoji: '🚗', tone: 'from-[#d8f6ea] to-[#f3fff8]' },
  { to: '/profile/cart', label: 'My Cart', description: 'Cars you added and are ready to buy', icon: ShoppingCart, emoji: '🛒', tone: 'from-[#dbeafe] to-[#eef6ff]' },
  { to: '/profile/enquiries', label: 'My Enquiries', description: 'Questions you sent about cars for sale', icon: ClipboardList, emoji: '📋', tone: 'from-[#ffe8d6] to-[#fff6ee]' },
  { to: '/profile/wishlist', label: 'My Wishlist', description: 'Cars you shortlisted to revisit', icon: Heart, emoji: '❤️', tone: 'from-[#ffe0ea] to-[#fff7f9]' },
  { to: '/profile/saved-searches', label: 'Saved Searches', description: 'Saved filters and new-match alerts', icon: Search, emoji: '🔍', tone: 'from-[#d8f6ea] to-[#f3fff8]' },
  { to: '/profile/comparisons', label: 'Comparisons', description: 'Cars you saved side by side', icon: GitCompare, emoji: '⚖️', tone: 'from-[#efe4ff] to-[#faf7ff]' },
  ...(SHOW_TEST_DRIVE ? [{ to: '/profile/test-drives', label: 'My Test Drives', description: 'Home and dealership drives you booked', icon: Gauge, emoji: '🚘', tone: 'from-[#d9ecff] to-[#f3f9ff]' }] : []),
  { to: '/profile/pdi', label: 'Car Inspection', description: 'Visit status and inspection reports', icon: ClipboardCheck, emoji: '✅', tone: 'from-[#ccfbf1] to-[#f0fdfa]' },
  { to: '/profile/finance-applications', label: 'Finance', description: 'Loan requests and their progress', icon: Landmark, emoji: '💰', tone: 'from-[#fef3c7] to-[#fffbeb]' },
  { to: '/profile/insurance-enquiries', label: 'Insurance', description: 'Quotes, add-ons and cover requests', icon: Shield, emoji: '🛡️', tone: 'from-[#fce7f3] to-[#fff7fb]' },
  { to: '/profile/notifications', label: 'Notifications', description: 'Price drops, matches and account alerts', icon: Bell, emoji: '🔔', tone: 'from-[#e0e7ff] to-[#f5f7ff]' },
];

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);
  return desktop;
}

function MobileAccountHub({ user, onLogout }) {
  const initial = (user?.name || user?.mobile || 'U')[0].toUpperCase();
  return (
    <div className="px-4 pt-3 pb-28">
      <div className="rounded-3xl bg-gradient-to-br from-[#3083ff] to-[#1853ff] text-white p-4 flex items-center gap-3 shadow-[0_12px_28px_rgba(48,131,255,0.28)]">
        <span className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black shrink-0">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-black truncate">{user?.name || 'Your account'}</p>
          <p className="text-[12px] font-semibold text-blue-100 truncate">{user?.mobile || user?.email || 'Manage your 4tyrezz account'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {LINKS.map(({ to, label, emoji, tone }) => (
          <Link
            key={to}
            to={to}
            className={`h-[108px] rounded-2xl bg-gradient-to-b ${tone} border border-white shadow-[0_8px_20px_rgba(15,23,42,0.06)] px-1.5 py-2.5 flex flex-col items-center justify-center gap-1.5 text-center active:scale-[0.98] transition-transform`}
          >
            <span className="text-[26px] leading-none">{emoji}</span>
            <span className="text-[11px] font-black text-slate-900 leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-4 w-full h-14 rounded-[22px] bg-gradient-to-r from-[#ffe0ea] to-[#fff1f2] border border-white text-rose-600 text-sm font-black inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.05)] active:scale-[0.98]"
      >
        <span className="text-lg leading-none">🚪</span>
        Logout
      </button>
    </div>
  );
}

export default function ProfileLayout() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const desktop = useIsDesktop();
  const isHub = pathname === '/profile';
  const current = LINKS.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  if (user?.role === 'dealer') return <Navigate to="/dealer/dashboard" replace />;
  if (isHub && desktop) return <Navigate to="/profile/settings" replace />;

  const signOut = () => {
    dispatch(logout());
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-[#f6f7fb] lg:bg-slate-50 min-h-[calc(100vh-72px)] overflow-x-hidden pb-4">
      <div className="max-w-[1240px] mx-auto px-0 lg:px-8 lg:py-10 grid lg:grid-cols-[240px_1fr] gap-4 lg:gap-8">
        <aside className="hidden lg:block lg:sticky lg:top-28 h-max rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3083ff] px-3 mb-2 lg:mb-3">My account</p>
          <p className="px-3 pb-3 lg:pb-4 font-black text-slate-900 text-sm truncate">{user?.name || user?.mobile || 'Your profile'}</p>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-visible pb-1 -mx-1 px-1">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-bold transition shrink-0 ${
                    isActive ? 'bg-[#3083ff] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 w-full text-left px-3 py-2.5 text-xs font-black text-[#3083ff] hover:bg-slate-50 rounded-xl"
          >
            Logout
          </button>
        </aside>
        <div className="min-w-0 max-w-full overflow-x-hidden">
          {isHub ? (
            <MobileAccountHub user={user} onLogout={signOut} />
          ) : (
            <>
              <div className="lg:hidden fixed top-0 inset-x-0 z-40">
                <div className="bg-[#3083ff] text-white px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-2.5 rounded-b-[24px] shadow-[0_10px_24px_rgba(48,131,255,0.22)]">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    aria-label="Back"
                    className="w-10 h-10 rounded-full bg-white/15 inline-flex items-center justify-center shrink-0 active:bg-white/25"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0 text-left">
                    <p className="text-[15px] font-semibold leading-tight truncate">{current?.label || 'Account'}</p>
                    <p className="text-[12px] font-normal text-white/80 leading-snug mt-0.5">{current?.description || 'Your account'}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4 pt-[calc(5.5rem+env(safe-area-inset-top))] lg:p-0">
                <Outlet />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileCard({ title, eyebrow, children, action }) {
  return (
    <div className="lg:rounded-3xl lg:border lg:border-white/80 lg:bg-white/80 lg:backdrop-blur-xl lg:p-6 lg:shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
      <div className="hidden lg:flex items-start justify-between gap-3 mb-5">
        <div>
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3083ff]">{eyebrow}</p>}
          {title && <h1 className="font-display font-black text-2xl text-slate-900 tracking-tight mt-1">{title}</h1>}
        </div>
        {action}
      </div>
      {action ? <div className="lg:hidden flex justify-end mb-3">{action}</div> : null}
      {children}
    </div>
  );
}

export function EmptyNote({ children }) {
  return (
    <p className="text-[13px] font-normal text-slate-500 text-center rounded-[22px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] px-5 py-8 lg:bg-transparent lg:shadow-none lg:px-0 lg:py-10">
      {children}
    </p>
  );
}
