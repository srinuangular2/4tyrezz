import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import {
  DashboardOutlined, PeopleOutline, StorefrontOutlined, DirectionsCarOutlined,
  BrandingWatermarkOutlined, CategoryOutlined, LocationOnOutlined, FactCheckOutlined, LogoutOutlined,
  ViewCarouselOutlined,FlagOutlined
} from '@mui/icons-material';

const NAV = [
  ['/', 'Dashboard', DashboardOutlined],
  ['/cars', 'Cars', DirectionsCarOutlined],
  ['/approvals', 'Approvals', FactCheckOutlined],
  ['/banners', 'Banners', ViewCarouselOutlined],
  ['/reports', 'Reported Ads', FlagOutlined],
  ['/users', 'Users', PeopleOutline],
  ['/dealers', 'Dealers', StorefrontOutlined],
  ['/brands', 'Brands', BrandingWatermarkOutlined],
  ['/models', 'Models', CategoryOutlined],
  ['/cities', 'Cities', LocationOnOutlined],
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-64 bg-ink text-white flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="font-display font-bold text-xl">4tyrez<span className="text-ember">z</span></span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(([to, label, Icon]) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-ember text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon fontSize="small" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => { dispatch(logout()); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
            <LogoutOutlined fontSize="small" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-3">
          <span className="text-sm font-semibold">{user?.name}</span>
          <span className="w-9 h-9 rounded-full bg-ember text-white flex items-center justify-center text-sm font-bold">
            {(user?.name || 'A')[0].toUpperCase()}
          </span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
