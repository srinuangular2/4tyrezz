import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import AdminSidebar from '../components/admin/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { RealtimeAlertsProvider } from '../hooks/useRealtimeAlerts';

function executiveAllowed(pathname) {
  return pathname === '/'
    || pathname === '/cars'
    || pathname === '/cars/add'
    || pathname.startsWith('/cars/edit/')
    || pathname === '/profile'
    || pathname.startsWith('/executive/');
}

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  const childAdmin = user?.role === 'field_agent' || user?.role === 'executive_agent';
  const executiveRedirect = user?.role === 'executive_agent' && pathname === '/sold'
    ? '/cars?filter=sold'
    : user?.role === 'executive_agent' && !executiveAllowed(pathname)
      ? '/'
      : '';

  return (
    <RealtimeAlertsProvider token={token} enabled={Boolean(token) && !childAdmin} variant="admin" role={user?.role || ''}>
      <div className="flex h-screen overflow-hidden bg-[#090d16] text-slate-100">
        <AdminSidebar
          user={user}
          onLogout={() => {
            dispatch(logout());
            navigate('/login');
          }}
        />
        <div className="ml-72 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex h-16 shrink-0 items-center justify-end gap-3 border-b border-slate-800/80 bg-slate-950/70 px-6 backdrop-blur-xl">
            {!childAdmin && <NotificationBell variant="admin" />}
            <span className="text-sm font-semibold text-slate-300">{user?.name}</span>
            <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-[0_0_16px_rgba(59,130,246,0.45)]">
              {(user?.name || 'A')[0].toUpperCase()}
            </span>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {executiveRedirect ? <Navigate to={executiveRedirect} replace /> : <Outlet />}
          </main>
        </div>
      </div>
    </RealtimeAlertsProvider>
  );
}
