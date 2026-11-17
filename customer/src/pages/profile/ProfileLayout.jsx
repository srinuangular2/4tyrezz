import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, LogOut } from 'lucide-react';
import { logout } from '../../app/authSlice';
import AccountAvatar from '../../components/AccountAvatar';
import { AccountIcon, accountGroups, accountLinks, findAccountLink } from '../../lib/accountNav';

const LINKS = accountLinks();
const GROUPS = accountGroups();

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
        {LINKS.map(({ to, label, emoji, tile }) => (
          <Link
            key={to}
            to={to}
            className={`h-[108px] rounded-2xl bg-gradient-to-b ${tile} border border-white shadow-[0_8px_20px_rgba(15,23,42,0.06)] px-1.5 py-2.5 flex flex-col items-center justify-center gap-1.5 text-center active:scale-[0.98] transition-transform`}
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
    <div className="bg-[#f6f7fb] lg:bg-[#f4f7fb] min-h-[calc(100vh-72px)] pb-4">
      <div className="max-w-[1240px] mx-auto grid gap-4 px-0 lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8 lg:px-8 lg:pb-8 lg:pt-5">
        <aside className="hidden lg:sticky lg:top-[148px] lg:z-30 lg:block lg:max-h-[calc(100vh-164px)] lg:self-start lg:overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex shrink-0 items-center gap-3 border-b border-slate-100 px-1 pb-4">
            <AccountAvatar user={user} className="h-12 w-12 text-[16px]" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-slate-900">{user?.name || 'Your account'}</p>
              <p className="truncate text-[12px] text-slate-500">{user?.mobile || user?.email || 'Customer profile'}</p>
            </div>
          </div>
          <nav className="space-y-4 pr-1">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-2.5 pb-1.5 text-[12px] font-semibold text-slate-400">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map(({ to, label, icon, tone }) => (
                    <NavLink key={to} to={to} className="block">
                      {({ isActive }) => (
                        <span className={`flex items-center gap-3 rounded-2xl px-2 py-1.5 transition ${isActive ? 'bg-[#eef5ff]' : 'hover:bg-slate-50'}`}>
                          <AccountIcon icon={icon} tone={tone} />
                          <span className={`text-[14px] font-semibold ${isActive ? 'text-[#1853ff]' : 'text-slate-800'}`}>{label}</span>
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <button
            type="button"
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left hover:bg-rose-50"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={2.1} />
            </span>
            <span className="text-[14px] font-semibold text-rose-600">Log out</span>
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
                {current ? (
                  <div className="mb-5 hidden items-center gap-4 lg:flex">
                    <AccountIcon icon={current.icon} tone={current.tone} size="lg" />
                    <div>
                      <h1 className="text-[26px] font-semibold leading-tight text-slate-900">{current.label}</h1>
                      <p className="mt-1 text-[14px] text-slate-500">{current.description}</p>
                    </div>
                  </div>
                ) : null}
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
  const { pathname } = useLocation();
  const page = findAccountLink(pathname);
  const isPageTitle = Boolean(page?.titles?.includes(String(title || '').trim().toLowerCase()));
  const showSectionTitle = !isPageTitle && Boolean(title || eyebrow);

  return (
    <div className="lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:p-6 lg:shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      {(showSectionTitle || action) ? (
        <div className="mb-5 hidden items-start justify-between gap-3 lg:flex">
          {showSectionTitle ? (
            <div>
              {eyebrow ? <p className="text-[12px] font-semibold text-[#3083ff]">{eyebrow}</p> : null}
              {title ? <h2 className="mt-0.5 text-[18px] font-semibold text-slate-900">{title}</h2> : null}
            </div>
          ) : <span />}
          {action}
        </div>
      ) : null}
      {action ? <div className="mb-3 flex justify-end lg:hidden">{action}</div> : null}
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
