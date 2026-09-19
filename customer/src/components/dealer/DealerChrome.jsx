import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../app/authSlice';
import NotificationBell from '../NotificationBell';

export default function DealerChrome({ children }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <Link to={user ? '/dealer/dashboard' : '/dealer/login'} className="flex items-center gap-3 min-w-0">
          <img src="/blue-logo.png" alt="4tyrezz" className="h-9 w-auto" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Dealer portal</span>
        </Link>
        {user?.role === 'dealer' ? (
          <div className="flex items-center gap-3">
            <NotificationBell variant="customer" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-500 truncate max-w-[180px]">
              {user.dealerCode || user.dealershipName || user.name}
            </span>
            <span className="w-9 h-9 rounded-full bg-[#3083ff] text-white flex items-center justify-center text-sm font-bold">
              {(user?.name || user?.dealerCode || 'D')[0].toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => {
                dispatch(logout());
                navigate('/dealer/login');
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/dealer/login" className="text-xs font-black uppercase tracking-wider text-[#3083ff]">
            Sign in
          </Link>
        )}
      </header>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
