import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DealerSidebar from '../../components/dealer/DealerSidebar';

export default function DealerLayout() {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  if (user?.role !== 'dealer') return <Navigate to="/dealer/login" replace />;

  const verified = Boolean(user?.kycVerified);
  const inventoryLocked = !verified && /\/dealer\/dashboard\/(inventory|add-car|edit-car|bulk-upload)/.test(location.pathname);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-72px)]">
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
        <DealerSidebar />
        <div className="min-w-0">
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
        </div>
      </div>
    </div>
  );
}
