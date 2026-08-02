import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import { Menu, Close, Chevron, Heart } from './icons';
import OtpLoginModal from './OtpLoginModal';
import ExploreMegaMenu from './ExploreMegaMenu';

export default function Header() {
  const { user } = useSelector((s) => s.auth);
  const wishlistCount = useSelector((s) => s.wishlist.ids.length);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const isDealer = user?.role === 'dealer';
  // Non-dealer, logged-in accounts are "Users" — dealer-only actions (Add
  // Car, Inventory, Leads) must never be reachable from here.
  const isUser = user && !isDealer;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="container-px h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display font-bold text-2xl tracking-tight">
              4tyre<span className="text-gradient">zz</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink/70">
              <div className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
                <button className="flex items-center gap-1 hover:text-ember py-2 transition" onClick={() => setMegaOpen((v) => !v)}>
                  Explore By <Chevron />
                </button>
                {megaOpen && <ExploreMegaMenu onNavigate={() => setMegaOpen(false)} />}
              </div>
              <Link to="/cars" className="hover:text-ember transition">Buy Used Car</Link>
              <Link to="/cars?bodyType=SUV" className="hover:text-ember transition">SUVs</Link>
              <Link to="/cars?fuel=Electric" className="hover:text-ember transition">Electric Cars</Link>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-5">
            {!isDealer && (
              <Link to={isUser ? '/dashboard/wishlist' : '#'} onClick={() => !user && setShowLogin(true)} className="relative text-ink/70 hover:text-ember transition" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-ember text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}
            {!user && (
              <Link to="/dealer/login" className="text-sm font-semibold text-ink/60 hover:text-ember transition">Dealer Login</Link>
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
                    {isDealer && <Link to="/dashboard/inventory" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-brand-gradient-soft">My Inventory</Link>}
                    {isDealer && <Link to="/dashboard/add-car" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-brand-gradient-soft">Add Car</Link>}
                    {isDealer && <Link to="/dashboard/leads" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-brand-gradient-soft">Leads</Link>}
                    {isUser && <Link to="/dashboard/wishlist" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-brand-gradient-soft">Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</Link>}
                    <Link to="/dashboard/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-brand-gradient-soft">Profile</Link>
                    <button onClick={() => { dispatch(logout()); setUserMenu(false); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-ember font-semibold hover:bg-brand-gradient-soft">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="bg-brand-gradient hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-card">
                Login
              </button>
            )}
          </div>

          <button className="lg:hidden text-ink" onClick={() => setMobileOpen(true)}><Menu /></button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-white p-6 lg:hidden animate-fadeUp overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <span className="font-display font-bold text-2xl">4tyre<span className="text-gradient">zz</span></span>
            <button onClick={() => setMobileOpen(false)}><Close /></button>
          </div>
          <nav className="flex flex-col gap-5 text-lg font-semibold">
            <Link to="/cars" onClick={() => setMobileOpen(false)}>Buy Used Car</Link>
            <Link to="/cars?bodyType=SUV" onClick={() => setMobileOpen(false)}>SUVs</Link>
            <Link to="/cars?fuel=Electric" onClick={() => setMobileOpen(false)}>Electric Cars</Link>
            {user ? (
              <>
                {isDealer && <Link to="/dashboard/inventory" onClick={() => setMobileOpen(false)}>My Inventory</Link>}
                {isDealer && <Link to="/dashboard/add-car" onClick={() => setMobileOpen(false)}>Add Car</Link>}
                {isDealer && <Link to="/dashboard/leads" onClick={() => setMobileOpen(false)}>Leads</Link>}
                {isUser && <Link to="/dashboard/wishlist" onClick={() => setMobileOpen(false)}>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</Link>}
                <Link to="/dashboard/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={() => { dispatch(logout()); setMobileOpen(false); navigate('/'); }} className="text-left text-ember">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => { setMobileOpen(false); setShowLogin(true); }} className="text-left">Login</button>
                <Link to="/dealer/login" onClick={() => setMobileOpen(false)}>Dealer Login</Link>
              </>
            )}
          </nav>
        </div>
      )}

      {showLogin && <OtpLoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
