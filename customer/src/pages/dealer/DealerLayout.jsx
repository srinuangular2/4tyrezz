import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DealerSidebar from '../../components/dealer/DealerSidebar';
import { fetchMe } from '../../app/authSlice';

export default function DealerLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (user?.role !== 'dealer') return <Navigate to="/dealer/login" replace />;

  const verified = Boolean(user?.kycVerified);
  const inventoryLocked = !verified && /\/dealer\/dashboard\/(inventory|add-car|edit-car|bulk-upload)/.test(location.pathname);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900">
      <DealerSidebar />
      <div className="lg:pl-72 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {!verified && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Inventory stays locked until KYC is approved.{' '}
              <Link to="/dealer/dashboard/onboarding" className="text-[#3083ff] font-black">Complete onboarding</Link>
            </div>
          )}
          {inventoryLocked ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
              <p className="font-black text-slate-900">Inventory access blocked</p>
              <p className="text-sm font-semibold text-slate-500 mt-2">Submit KYC and wait for approval before listing cars.</p>
              <Link to="/dealer/dashboard/onboarding" className="inline-block mt-4 bg-[#3083ff] hover:bg-[#1853ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3">
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
