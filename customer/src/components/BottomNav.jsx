import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, CarFront, Tag, ClipboardCheck, Gauge } from 'lucide-react';

export default function BottomNav() {
  const role = useSelector((s) => s.auth.user?.role);
  if (role === 'dealer') return null;

  const tabs = [
    { to: '/cars', label: 'Buy Cars', icon: CarFront },
    { to: '/sell', label: 'Sell', icon: Tag },
    { to: '/', label: 'Home', icon: Home, end: true, featured: true },
    { to: '/inspection', label: 'Inspection', icon: ClipboardCheck },
    { to: '/valuation', label: 'Valuation', icon: Gauge },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-[62px]">
        {tabs.map(({ to, label, icon: Icon, end, featured }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 min-h-11 text-[10px] font-bold active:scale-95 transition-transform duration-150 ${
                isActive ? 'text-[#3083ff]' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              featured ? (
                <>
                  <span className={`-mt-5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    isActive ? 'bg-[#1853ff] text-white shadow-blue-500/30' : 'bg-[#3083ff] text-white shadow-blue-500/25'
                  }`}>
                    <Icon className="w-6 h-6" strokeWidth={2.6} />
                  </span>
                  <span className="mt-0.5">{label}</span>
                </>
              ) : (
                <>
                  <span className={`w-10 h-7 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-50' : ''}`}>
                    <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.6 : 2} />
                  </span>
                  {label}
                </>
              )
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
