import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react';

export default function BottomNav() {
  const role = useSelector((s) => s.auth.user?.role);
  const isDealer = role === 'dealer';
  const tabs = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/cars', label: 'Search', icon: Search },
    { to: isDealer ? '/dealer/dashboard/add-car' : '/sell', label: isDealer ? 'Add' : 'Sell', icon: PlusCircle },
    { to: isDealer ? '/dealer/dashboard/leads' : '/profile/wishlist', label: isDealer ? 'Leads' : 'Saved', icon: Heart },
    { to: isDealer ? '/dealer/dashboard' : '/profile/settings', label: 'Account', icon: User },
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
