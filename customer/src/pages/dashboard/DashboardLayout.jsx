import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function DashboardLayout() {
  const { user } = useSelector((s) => s.auth);
  const isDealer = user?.role === 'dealer';

  const tabs = isDealer
    ? [['Inventory', 'inventory'], ['Add Car', 'add-car'], ['Leads', 'leads'], ['Profile', 'profile']]
    : [['Wishlist', 'wishlist'], ['Profile', 'profile']];

  return (
    <div className="container-px py-10">
      <h1 className="font-display font-bold text-3xl mb-6">
        {isDealer ? 'Dealer Dashboard' : 'My Dashboard'}
      </h1>
      <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
        {tabs.map(([label, path]) => (
          <NavLink
            key={path} to={`/dashboard/${path}`}
            className={({ isActive }) => `px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${isActive ? 'border-ember text-ember' : 'border-transparent text-slate2 hover:text-ink'}`}
          >
            {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
