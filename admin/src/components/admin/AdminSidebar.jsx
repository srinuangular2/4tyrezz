import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, Users, Store, CarFront, Library,
  Target, Gauge, CreditCard, Wallet, Percent,   Landmark, Shield, Repeat,
  Megaphone, Star, LifeBuoy, FileText, Settings, LogOut,
} from 'lucide-react';
import { SidebarCountBadge } from '../NotificationBell';
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts';

const GROUPS = [
  {
    label: 'Overview & performance',
    items: [
      { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
      { to: '/analytics', label: 'Reports & analytics', Icon: LineChart },
    ],
  },
  {
    label: 'Platform entities',
    items: [
      { to: '/customers', label: 'Customers', Icon: Users },
      { to: '/dealers', label: 'Dealers', Icon: Store, badgeKey: 'kycPending', badgeLabel: 'Pending' },
      { to: '/cars', label: 'Vehicle listings', Icon: CarFront },
      { to: '/inventory', label: 'Master inventory', Icon: Library },
    ],
  },
  {
    label: 'Sales & operations',
    items: [
      { to: '/leads', label: 'Leads', Icon: Target, badgeKey: 'leads', badgeLabel: 'New' },
      { to: '/test-drives', label: 'Test drives', Icon: Gauge, badgeKey: 'testDrives', badgeLabel: 'Pending' },
      { to: '/bookings', label: 'Bookings & tokens', Icon: CreditCard, badgeKey: 'bookings', badgeLabel: 'New' },
      { to: '/payments', label: 'Payments & ledger', Icon: Wallet },
      { to: '/commissions', label: 'Commissions & payouts', Icon: Percent },
      { to: '/finance', label: 'Finance leads', Icon: Landmark },
      { to: '/insurance', label: 'Insurance leads', Icon: Shield },
      { to: '/sell-exchange', label: 'Sell / Exchange', Icon: Repeat },
    ],
  },
  {
    label: 'Marketing, moderation & support',
    items: [
      { to: '/promotions', label: 'Promotions & featured', Icon: Megaphone },
      { to: '/listings/moderation', label: 'Listing moderation', Icon: FileText, badgeKey: 'moderation', badgeLabel: 'Pending' },
      { to: '/reviews', label: 'Reviews & ratings', Icon: Star },
      { to: '/support', label: 'Complaints & tickets', Icon: LifeBuoy },
      { to: '/content', label: 'Content CMS', Icon: FileText },
      { to: '/settings', label: 'System settings', Icon: Settings },
    ],
  },
];

export default function AdminSidebar({ user, onLogout }) {
  const alerts = useRealtimeAlerts();
  const counts = alerts?.counts || {};
  const unreadByType = counts.unreadByType || {};

  return (
    <aside className="w-72 bg-[#070b14]/80 backdrop-blur-xl border-r border-slate-800/80 text-slate-200 flex-shrink-0 flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80">
        <img src="/blue-logo.png" alt="4TYREZZ" className="h-9 w-auto bg-white rounded-md px-1.5 py-0.5" />
      </div>
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, Icon, end, badgeKey, badgeLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span className="truncate">{label}</span>
                  {badgeKey && (
                    <SidebarCountBadge
                      count={counts[badgeKey] || 0}
                      label={badgeLabel}
                      pulse={(unreadByType[badgeKey] || 0) > 0}
                    />
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800/80">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-500 truncate">{user?.email || user?.name}</p>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
