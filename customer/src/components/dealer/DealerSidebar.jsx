import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Car,
  IdCard,
  PlusCircle,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';

export const DEALER_LINKS = [
  { to: '/dealer/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dealer/dashboard/inventory', label: 'Inventory', icon: Car },
  { to: '/dealer/dashboard/inventory/add', label: 'Add vehicle', icon: PlusCircle },
  { to: '/dealer/dashboard/inventory/bulk', label: 'Bulk upload', icon: Upload },
  { to: '/dealer/dashboard/promotions', label: 'Promotions', icon: Sparkles },
  { to: '/dealer/dashboard/onboarding', label: 'Onboarding & KYC', icon: IdCard },
  { to: '/dealer/dashboard/settings', label: 'Profile & settings', icon: Settings },
];

export default function DealerSidebar() {
  const { user } = useSelector((s) => s.auth);
  const verified = Boolean(user?.kycVerified);

  return (
    <aside className="w-full lg:fixed lg:top-16 lg:left-0 lg:h-[calc(100vh-4rem)] lg:w-72 bg-[#3083ff] text-white flex flex-col z-20">
      <div className="px-5 py-4 border-b border-white/20 hidden lg:block">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">Dealer workspace</p>
        <p className="font-semibold text-white text-sm truncate mt-2">{user?.dealershipName || user?.name || 'Dealership'}</p>
        <p className="text-[11px] font-semibold text-white/70 mt-0.5 truncate">{user?.name}</p>
        {user?.dealerCode && (
          <p className="text-[11px] font-mono font-bold text-white/80 mt-1 truncate">{user.dealerCode}</p>
        )}
        <span className={`inline-flex mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
          verified ? 'bg-white text-[#1853ff]' : 'bg-amber-300 text-amber-950'
        }`}>
          {verified ? 'KYC verified' : user?.kycStatus || 'KYC pending'}
        </span>
      </div>
      <nav className="flex-1 py-3 px-3 overflow-x-auto lg:overflow-y-auto">
        <div className="flex lg:flex-col gap-1">
          {DEALER_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 whitespace-nowrap px-3 py-2.5 rounded-xl text-[13px] font-semibold transition ${
                  isActive
                    ? 'bg-white text-[#1853ff] shadow-sm'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
