import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <RealtimeAlertsProvider token={token} enabled={Boolean(token) && !childAdmin} variant="admin" role={user?.role || ''}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#090d16] text-slate-100">
        <AdminSidebar
          user={user}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={() => {
            dispatch(logout());
            navigate('/login');
          }}
        />
        <div className="flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden lg:ml-72">
          <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-slate-800/80 bg-slate-950/70 px-3 backdrop-blur-xl sm:h-16 sm:px-6">
            <button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-200 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-300 lg:text-right">{user?.name}</span>
            {!childAdmin && <NotificationBell variant="admin" />}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-[0_0_16px_rgba(59,130,246,0.45)]">
              {(user?.name || 'A')[0].toUpperCase()}
            </span>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6">
            {executiveRedirect ? <Navigate to={executiveRedirect} replace /> : <Outlet />}
          </main>
        </div>
      </div>
    </RealtimeAlertsProvider>
  );
}
