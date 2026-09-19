import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react';

export default function BottomNav() {
  const role = useSelector((s) => s.auth.user?.role);
  if (role === 'dealer') return null;

  const tabs = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/cars', label: 'Search', icon: Search },
    { to: '/sell', label: 'Sell', icon: PlusCircle },
    { to: '/profile/wishlist', label: 'Saved', icon: Heart },
    { to: '/profile/settings', label: 'Account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto max-w-md grid grid-cols-5 h-16">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
                isActive ? 'text-[#3083ff]' : 'text-slate-500'
              }`
            }
          >
            <Icon className="w-5 h-5" strokeWidth={2.25} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
