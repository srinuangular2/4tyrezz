import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DealerSidebar from '../components/dealer/DealerSidebar';
import { fetchMe, logout } from '../app/authSlice';

export default function DealerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (user?.role !== 'dealer') return <Navigate to="/dealer/login" replace />;

  const verified = Boolean(user?.kycVerified);
  const inventoryLocked = !verified && /\/dealer\/dashboard\/(inventory|add-car|edit-car|bulk-upload)/.test(location.pathname);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <DealerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
          <div className="h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Dealer workspace</p>
            <p className="text-sm font-bold text-slate-800 truncate">{user?.dealershipName || user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-semibold text-slate-500">{user?.dealerCode}</span>
            <button
              type="button"
              onClick={() => {
                dispatch(logout());
                navigate('/dealer/login');
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
          </div>
          <nav className="lg:hidden flex gap-2 overflow-x-auto px-4 pb-3">
            {[
              ['/dealer/dashboard', 'Dashboard'],
              ['/dealer/dashboard/inventory', 'Inventory'],
              ['/dealer/dashboard/inventory/add', 'Add car'],
              ['/dealer/onboarding', 'KYC'],
              ['/dealer/dashboard/settings', 'Settings'],
            ].map(([to, label]) => (
              <Link key={to} to={to} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {!verified && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Inventory stays locked until KYC is approved.{' '}
              <Link to="/dealer/onboarding" className="text-[#3083ff] font-black">Complete onboarding</Link>
            </div>
          )}
          {inventoryLocked ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <p className="font-black text-slate-900">Inventory access blocked</p>
              <p className="text-sm font-semibold text-slate-500 mt-2">Submit KYC and wait for approval before listing cars.</p>
              <Link to="/dealer/onboarding" className="inline-block mt-4 bg-[#3083ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3">
                Go to onboarding
              </Link>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
