import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import AdminSidebar from '../components/admin/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { RealtimeAlertsProvider } from '../hooks/useRealtimeAlerts';

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';

  return (
    <RealtimeAlertsProvider token={token} enabled={Boolean(token)} variant="admin">
      <div className="min-h-screen flex bg-[#090d16] text-slate-100">
        <AdminSidebar
          user={user}
          onLogout={() => {
            dispatch(logout());
            navigate('/login');
          }}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-end px-6 gap-3 sticky top-0 z-20">
            <NotificationBell variant="admin" />
            <span className="text-sm font-semibold text-slate-300">{user?.name}</span>
            <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-[0_0_16px_rgba(59,130,246,0.45)]">
              {(user?.name || 'A')[0].toUpperCase()}
            </span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </RealtimeAlertsProvider>
  );
}
