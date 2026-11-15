import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Car, Home, IdCard, LogOut, Plus, Sparkles, Upload, UserRound, X } from 'lucide-react';
import { logout } from '../../app/authSlice';
import NotificationBell from '../NotificationBell';
import AccountAvatar from '../AccountAvatar';

const ACCOUNT_LINKS = [
  { to: '/dealer/dashboard', label: 'Home', icon: Home, tone: 'from-[#dbeafe] to-[#f4f9ff]' },
  { to: '/dealer/dashboard/inventory', label: 'Stock', icon: Car, tone: 'from-[#d8f6ea] to-[#f3fff8]' },
  { to: '/dealer/dashboard/inventory/add', label: 'Add cars', icon: Plus, tone: 'from-[#dbeafe] to-[#eef6ff]' },
  { to: '/dealer/dashboard/inventory/bulk', label: 'Bulk upload', icon: Upload, tone: 'from-[#ffe8d6] to-[#fff6ee]' },
  { to: '/dealer/dashboard/promotions', label: 'Offers', icon: Sparkles, tone: 'from-[#efe4ff] to-[#faf7ff]' },
  { to: '/dealer/dashboard/onboarding', label: 'KYC', icon: IdCard, tone: 'from-[#fef3c7] to-[#fffbeb]' },
  { to: '/dealer/dashboard/settings', label: 'Profile', icon: UserRound, tone: 'from-[#e0e7ff] to-[#f5f7ff]' },
];

export default function DealerChrome({ children }) {
  const { user } = useSelector((s) => s.auth);
  const dealer = user?.role === 'dealer' ? user : null;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menu]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7fb] text-slate-900">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3">
        <div className="flex min-w-0 items-center gap-2">
          {!dealer && (
            <Link to="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-label="Customer home">
              <Home className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          )}
          <Link to={dealer ? '/dealer/dashboard' : '/dealer/login'} className="flex min-w-0 items-center" aria-label="4tyrezz">
            <img src="/blue-logo.png" alt="4tyrezz" className="h-8 w-auto" />
          </Link>
        </div>
        {dealer && (
          <div className="flex items-center gap-1">
            <NotificationBell variant="customer" />
            <button
              type="button"
              onClick={() => setMenu((open) => !open)}
              className="flex h-9 w-9 items-center justify-center"
              aria-label="Account menu"
            >
              <AccountAvatar user={dealer} className="h-8 w-8 text-[13px]" />
            </button>
          </div>
        )}
      </header>
      {dealer && menu && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f6f7fb] lg:bg-slate-900/40 lg:px-4 lg:py-16">
          <button type="button" className="absolute inset-0 hidden lg:block" aria-label="Close account menu" onClick={() => setMenu(false)} />
          <div className="relative mx-auto min-h-full w-full max-w-md bg-[#f6f7fb] px-4 pb-8 pt-[max(12px,env(safe-area-inset-top))] lg:min-h-0 lg:rounded-3xl lg:pb-5 lg:shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[16px] font-semibold text-slate-900">Account</p>
              <button type="button" onClick={() => setMenu(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-[#3083ff] to-[#1853ff] p-4 text-white">
              <AccountAvatar user={dealer} tone="white" className="h-14 w-14 text-[20px]" />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold">{dealer.dealershipName || dealer.name || 'Showroom'}</p>
                <p className="truncate text-[12px] text-white/80">{dealer.dealerCode || dealer.name || 'Dealer account'}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {ACCOUNT_LINKS.map(({ to, label, icon: Icon, tone }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMenu(false)}
                  className={`flex h-[104px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-white bg-gradient-to-b ${tone} px-1.5 text-center shadow-[0_8px_20px_rgba(15,23,42,0.06)]`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[#1853ff]">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-slate-900">{label}</span>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                dispatch(logout());
                navigate('/dealer/login');
              }}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[22px] border border-white bg-gradient-to-r from-[#ffe0ea] to-[#fff1f2] text-[14px] font-semibold text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
