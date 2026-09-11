import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  Car,
  FileText,
  Gauge,
  IdCard,
  PlusCircle,
  Repeat,
  Settings,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';
import { SidebarCountBadge } from '../NotificationBell';
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts';

export const DEALER_LINKS = [
  { to: '/dealer/dashboard', label: 'Dashboard / KPIs', icon: BarChart3, end: true },
  { to: '/dealer/dashboard/inventory', label: 'Inventory Management', icon: Car },
  { to: '/dealer/dashboard/inventory/bulk', label: 'Bulk Upload (CSV/XLSX)', icon: Upload },
  { to: '/dealer/dashboard/inventory/add', label: 'Add Vehicle', icon: PlusCircle },
  { to: '/dealer/dashboard/leads', label: 'Lead CRM & Pipeline', icon: Target, badgeKey: 'leads', badgeLabel: 'New' },
  { to: '/dealer/dashboard/sell-leads', label: 'Sell / Exchange leads', icon: Repeat },
  { to: '/dealer/dashboard/test-drives', label: 'Test Drive Management', icon: Gauge, badgeKey: 'testDrives', badgeLabel: 'Pending' },
  { to: '/dealer/dashboard/bookings', label: 'Booking & Token Management', icon: FileText, badgeKey: 'bookings', badgeLabel: 'New' },
  { to: '/dealer/dashboard/promotions', label: 'Promotions & Featured Cars', icon: Sparkles },
  { to: '/dealer/dashboard/analytics', label: 'Performance Analytics', icon: BarChart3 },
  { to: '/dealer/onboarding', label: 'Onboarding & KYC', icon: IdCard },
  { to: '/dealer/dashboard/settings', label: 'Dealer Profile & Settings', icon: Settings },
];

export default function DealerSidebar() {
  const { user } = useSelector((s) => s.auth);
  const verified = Boolean(user?.kycVerified);
  const alerts = useRealtimeAlerts();
  const counts = alerts?.counts || {};
  const unreadByType = counts.unreadByType || {};

  return (
    <aside className="lg:sticky lg:top-28 h-max rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3083ff] px-3 mb-3">Dealer workspace</p>
      <div className="px-3 pb-4 border-b border-slate-100 mb-3">
        <p className="font-black text-slate-900 text-sm truncate">{user?.dealershipName || user?.name || 'Dealership'}</p>
        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{user?.name}</p>
        <span className={`inline-flex mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {verified ? 'KYC verified' : user?.kycStatus || 'KYC pending'}
        </span>
      </div>
      <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1">
        {DEALER_LINKS.map(({ to, label, icon: Icon, end, badgeKey, badgeLabel }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#3083ff] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={2.25} />
            <span className="truncate">{label}</span>
            {badgeKey && (
              <SidebarCountBadge
                count={counts[badgeKey] || 0}
                label={badgeLabel}
                pulse={(unreadByType[badgeKey] || 0) > 0}
                tone="dealer"
              />
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
