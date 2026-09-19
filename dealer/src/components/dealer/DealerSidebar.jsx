import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  Car,
  IdCard,
  PlusCircle,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';

export const DEALER_LINKS = [
  { to: '/dealer/dashboard', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/dealer/dashboard/inventory', label: 'Inventory', icon: Car },
  { to: '/dealer/dashboard/inventory/bulk', label: 'Bulk upload', icon: Upload },
  { to: '/dealer/dashboard/inventory/add', label: 'Add vehicle', icon: PlusCircle },
  { to: '/dealer/dashboard/promotions', label: 'Promotions', icon: Sparkles },
  { to: '/dealer/dashboard/analytics', label: 'Inventory reports', icon: BarChart3 },
  { to: '/dealer/onboarding', label: 'Onboarding & KYC', icon: IdCard },
  { to: '/dealer/dashboard/settings', label: 'Profile & settings', icon: Settings },
];

export default function DealerSidebar() {
  const { user } = useSelector((s) => s.auth);
  const verified = Boolean(user?.kycVerified);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white min-h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <p className="font-display font-black text-xl text-slate-900">4tyrezz</p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3083ff] mt-1">Dealer portal</p>
      </div>
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="font-black text-slate-900 text-sm truncate">{user?.dealershipName || user?.name || 'Dealership'}</p>
        <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">{user?.name}</p>
        {user?.dealerCode && (
          <p className="text-[11px] font-mono font-bold text-slate-400 mt-1 truncate">{user.dealerCode}</p>
        )}
        <span className={`inline-flex mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {verified ? 'KYC verified' : user?.kycStatus || 'KYC pending'}
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {DEALER_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#3083ff] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={2.25} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
