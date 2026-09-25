import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  ClipboardList,
  FileText,
  Gauge,
  GitCompare,
  Heart,
  Landmark,
  LifeBuoy,
  Search,
  Shield,
  User,
} from 'lucide-react';
import { logout } from '../../app/authSlice';
import { SHOW_TEST_DRIVE } from '../../lib/featureFlags';

const LINKS = [
  { to: '/profile/settings', label: 'My Profile', icon: User },
  { to: '/profile/enquiries', label: 'My Enquiries', icon: ClipboardList },
  { to: '/profile/wishlist', label: 'My Wishlist', icon: Heart },
  { to: '/profile/saved-searches', label: 'Saved Searches', icon: Search },
  { to: '/profile/comparisons', label: 'My Comparisons', icon: GitCompare },
  ...(SHOW_TEST_DRIVE ? [{ to: '/profile/test-drives', label: 'My Test Drives', icon: Gauge }] : []),
  { to: '/profile/bookings', label: 'My Bookings', icon: FileText },
  { to: '/profile/finance-applications', label: 'Finance Applications', icon: Landmark },
  { to: '/profile/insurance-enquiries', label: 'Insurance Enquiries', icon: Shield },
  { to: '/profile/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile/support-tickets', label: 'Support Tickets', icon: LifeBuoy },
];

export default function ProfileLayout() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  if (user?.role === 'dealer') return <Navigate to="/dealer/dashboard" replace />;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-72px)] overflow-x-hidden pb-4">
      <div className="container-px mx-auto px-3 sm:px-6 lg:px-8 py-4 lg:py-10 grid lg:grid-cols-[240px_1fr] gap-4 lg:gap-8 max-w-full">
        <aside className="lg:sticky lg:top-28 h-max rounded-2xl lg:rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-3 lg:p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] overflow-hidden">
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
            onClick={() => {
              dispatch(logout());
              navigate('/', { replace: true });
            }}
            className="mt-3 lg:mt-4 w-full text-left px-3 py-2.5 text-xs font-black text-[#3083ff] hover:bg-slate-50 rounded-xl"
          >
            Logout
          </button>
        </aside>
        <div className="min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function ProfileCard({ title, eyebrow, children, action }) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3083ff]">{eyebrow}</p>}
          {title && <h1 className="font-display font-black text-2xl text-slate-900 tracking-tight mt-1">{title}</h1>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyNote({ children }) {
  return <p className="text-sm font-semibold text-slate-500 py-10 text-center">{children}</p>;
}
