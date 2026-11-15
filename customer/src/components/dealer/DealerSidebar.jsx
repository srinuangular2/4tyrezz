import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Car,
  IdCard,
  LayoutDashboard,
  Plus,
  PlusCircle,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';

export const DEALER_LINKS = [
  { to: '/dealer/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/dealer/dashboard/inventory', label: 'Inventory', icon: Car },
  { to: '/dealer/dashboard/inventory/add', label: 'Add vehicle', icon: PlusCircle },
  { to: '/dealer/dashboard/inventory/bulk', label: 'Bulk upload', icon: Upload },
  { to: '/dealer/dashboard/promotions', label: 'Promotions', icon: Sparkles },
  { to: '/dealer/dashboard/onboarding', label: 'KYC', icon: IdCard },
  { to: '/dealer/dashboard/settings', label: 'Profile', icon: Settings },
];

const MOBILE_TABS = [
  { to: '/dealer/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/dealer/dashboard/inventory', label: 'Stock', icon: Car },
  { to: '/dealer/dashboard/inventory/add', label: 'Add cars', icon: Plus },
  { to: '/dealer/dashboard/onboarding', label: 'KYC', icon: IdCard },
  { to: '/dealer/dashboard/inventory/bulk', label: 'Bulk upload', icon: Upload },
];

export function DealerBottomNav() {
  const { pathname } = useLocation();
  const activeTab = (to) => {
    if (to.endsWith('/inventory/add')) return pathname.includes('/inventory/add');
    if (to.endsWith('/inventory/bulk')) return pathname.includes('/inventory/bulk');
    if (to.endsWith('/inventory')) return pathname.includes('/inventory') && !pathname.includes('/add') && !pathname.includes('/bulk');
    if (to === '/dealer/dashboard') return pathname === '/dealer/dashboard';
    return pathname.startsWith(to);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] lg:hidden">
      <div className="grid h-[62px] grid-cols-5">
        {MOBILE_TABS.map(({ to, label, icon: Icon, end }) => {
          const featured = to.endsWith('/inventory/add');
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={() => 'relative flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-bold active:scale-95'}
            >
              {() => {
                const on = activeTab(to);
                return featured ? (
                  <>
                    <span className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${on ? 'bg-[#1853ff] shadow-blue-500/30' : 'bg-[#3083ff] shadow-blue-500/25'}`}>
                      <Icon className="h-6 w-6" strokeWidth={2.6} />
                    </span>
                    <span className={`mt-0.5 ${on ? 'text-[#3083ff]' : 'text-slate-500'}`}>{label}</span>
                  </>
                ) : (
                  <>
                    <span className={`flex h-7 w-10 items-center justify-center rounded-full ${on ? 'bg-blue-50 text-[#3083ff]' : 'text-slate-500'}`}>
                      <Icon className="h-[22px] w-[22px]" strokeWidth={on ? 2.6 : 2} />
                    </span>
                    <span className={on ? 'text-[#3083ff]' : 'text-slate-500'}>{label}</span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default function DealerSidebar() {
  const { user } = useSelector((s) => s.auth);
  const verified = Boolean(user?.kycVerified);

  return (
    <aside className="fixed inset-y-14 left-0 z-20 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-100 px-4 py-4">
        <p className="truncate text-[14px] font-semibold text-slate-900">{user?.dealershipName || user?.name || 'Showroom'}</p>
        {user?.dealerCode && <p className="mt-0.5 truncate text-[12px] text-slate-500">{user.dealerCode}</p>}
        <span className={`mt-2 inline-flex rounded-lg px-2 py-1 text-[10px] font-semibold ${verified ? 'bg-[#eaf2ff] text-[#1853ff]' : 'bg-amber-50 text-amber-800'}`}>
          {verified ? 'KYC verified' : 'KYC pending'}
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {DEALER_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium ${
                isActive ? 'bg-[#eaf2ff] text-[#1853ff]' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
