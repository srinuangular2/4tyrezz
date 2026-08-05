import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import { Menu, Close, Chevron, Heart } from './icons';
import OtpLoginModal from './OtpLoginModal';
import ExploreByBar from './ExploreByBar';
import SearchBar from './SearchBar';

export default function Header() {
  const { user } = useSelector((s) => s.auth);
  const wishlistCount = useSelector((s) => s.wishlist.ids.length);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const isDealer = user?.role === 'dealer';
  // Non-dealer, logged-in accounts are "Users" — dealer-only actions (Add
  // Car, Inventory, Leads) must never be reachable from here.
  const isUser = user && !isDealer;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur  shadow-xs pt-3">
        <div className="container-px h-[72px] flex items-center gap-6 pb-3">
          <Link to="/" className="font-display font-bold text-2xl tracking-tight flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 110" width="100%" height="100%">
              <g transform="translate(10, 5)">
                <rect width="100" height="100" rx="22" fill="#f00"/>
                <path d="M 18 52 A 32 32 0 0 1 82 52" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"/>
                <circle cx="36" cy="36" r="4.5" fill="#FFFFFF"/>
                <path d="M 28 52 C 28 44 44 44 44 52" fill="#FFFFFF"/>
                <circle cx="50" cy="40" r="3.5" fill="#fff"/>
                <path d="M 44 52 C 44 46 56 46 56 52" fill="#fff"/>
                <circle cx="64" cy="36" r="4.5" fill="#FFFFFF"/>
                <path d="M 56 52 C 56 44 72 44 72 52" fill="#FFFFFF"/>
                <path d="M 22 62 Q 50 74 78 62" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round"/>
                <circle cx="22" cy="78" r="6" fill="#fff" stroke="#ea580c" strokeWidth="2"/>
                <circle cx="40" cy="78" r="6" fill="#fff" stroke="#ea580c" strokeWidth="2"/>
                <circle cx="60" cy="78" r="6" fill="#fff" stroke="#ea580c" strokeWidth="2"/>
                <circle cx="78" cy="78" r="6" fill="#fff" stroke="#ea580c" strokeWidth="2"/>
              </g>
              <text x="128" y="62" fontFamily="system-ui, -apple-system, sans-serif" fontSize="44" fontWeight="900" fill="#0F172A" letterSpacing="-1">
                4tyrezz<tspan fill="#DC2626">.</tspan>
              </text>
              <text x="130" y="84" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="500" fill="#64748B">
                Verified Pre-Owned Cars
              </text>
            </svg>
          </Link>

          <SearchBar className="hidden md:block flex-1 max-w-md" />

          <div className="hidden lg:flex items-center gap-5 ml-auto">
            {!isDealer && (
              <Link to={isUser ? '/dashboard/wishlist' : '#'} onClick={() => !user && setShowLogin(true)} className="relative text-slate-600 hover:text-red-600 transition" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}
            {!user && (
              <Link to="/dealer/login" className="text-sm font-semibold text-slate-600 hover:text-red-600 transition">Dealer Login</Link>
            )}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center text-xs font-bold">
                    {(user.name || user.mobile || 'U')[0].toUpperCase()}
                  </span>
                  {user.name || user.mobile}
                  <Chevron />
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 w-56 py-2 animate-fadeUp">
                    {isDealer && <Link to="/dashboard/inventory" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">My Inventory</Link>}
                    {isDealer && <Link to="/dashboard/add-car" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">Add Car</Link>}
                    {isDealer && <Link to="/dashboard/leads" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">Leads</Link>}
                    {isUser && <Link to="/dashboard/wishlist" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</Link>}
                    <Link to="/dashboard/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">Profile</Link>
                    <button onClick={() => { dispatch(logout()); setUserMenu(false); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 font-semibold hover:bg-slate-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="bg-brand-gradient hover:opacity-90 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm">
                Login
              </button>
            )}

            {/* Professional "Call Now" Badge */}
            <a
              href="tel:+919876543210"
              className="group flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-red-600/40 bg-slate-50 hover:bg-red-50/50 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-red-600 group-hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-xs shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-red-600 transition-colors">
                  Call Now
                </span>
                <span className="text-xs font-black text-slate-900 tracking-tight">
                  +91 91604 15851
                </span>
              </div>
            </a>
          </div>

          <button className="lg:hidden text-slate-900" onClick={() => setMobileOpen(true)}><Menu /></button>
        </div>
        <ExploreByBar />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-white p-6 lg:hidden animate-fadeUp overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="font-display font-bold text-2xl">4tyre<span className="text-gradient">zz</span></span>
            <button onClick={() => setMobileOpen(false)}><Close /></button>
          </div>
          <SearchBar className="mb-6" />
          <nav className="flex flex-col gap-5 text-lg font-semibold">
            <Link to="/cars" onClick={() => setMobileOpen(false)}>Browse all cars</Link>
            {user ? (
              <>
                {isDealer && <Link to="/dashboard/inventory" onClick={() => setMobileOpen(false)}>My Inventory</Link>}
                {isDealer && <Link to="/dashboard/add-car" onClick={() => setMobileOpen(false)}>Add Car</Link>}
                {isDealer && <Link to="/dashboard/leads" onClick={() => setMobileOpen(false)}>Leads</Link>}
                {isUser && <Link to="/dashboard/wishlist" onClick={() => setMobileOpen(false)}>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</Link>}
                <Link to="/dashboard/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={() => { dispatch(logout()); setMobileOpen(false); navigate('/'); }} className="text-left text-red-600">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => { setMobileOpen(false); setShowLogin(true); }} className="text-left">Login</button>
                <Link to="/dealer/login" onClick={() => setMobileOpen(false)}>Dealer Login</Link>
              </>
            )}

            {/* Mobile Call Now Section */}
            <div className="pt-5 border-t border-slate-100 mt-2">
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 active:bg-slate-100"
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Call Now
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    +91 98765 43210
                  </span>
                </div>
              </a>
            </div>
          </nav>
        </div>
      )}

      {showLogin && <OtpLoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}