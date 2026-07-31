import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useReferenceData from '../hooks/useReferenceData';
import { logout } from '../app/authSlice';
import { Menu, Close, Chevron } from './icons';
import OtpLoginModal from './OtpLoginModal';

export default function Header() {
  const { brands } = useReferenceData();
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const isDealer = user?.role === 'dealer';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="container-px h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display font-black text-2xl tracking-tight">
              4tyre<span className="text-gradient">zz</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink/70">
              <div className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
                <button className="flex items-center gap-1 hover:text-ember py-2 transition">
                  Buy Used Car <Chevron />
                </button>
                {megaOpen && (
                  <div className="absolute top-full left-0 bg-white text-ink rounded-2xl shadow-2xl border border-slate-100 p-6 w-[560px] grid grid-cols-2 gap-x-8 gap-y-1 animate-fadeUp">
                    <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-slate2 mb-1">Shop by brand</div>
                    {brands.slice(0, 10).map((b) => (
                      <Link key={b._id} to={`/cars?brand=${b._id}`} onClick={() => setMegaOpen(false)} className="py-1.5 text-sm hover:text-ember transition">
                        Used {b.name} Cars
                      </Link>
                    ))}
                    <Link to="/cars" onClick={() => setMegaOpen(false)} className="col-span-2 mt-2 text-sm font-bold text-ember">
                      View all used cars →
                    </Link>
                  </div>
                )}
              </div>
              <Link to="/cars?bodyType=SUV" className="hover:text-ember transition">SUVs</Link>
              <Link to="/cars?fuel=Electric" className="hover:text-ember transition">Electric Cars</Link>
              <Link to={user ? '/dashboard/add-car' : '#'} onClick={() => !user && setShowLogin(true)} className="hover:text-ember transition">Sell Your Car</Link>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-5">
            {!user && (
              <Link to="/dealer/login" className="text-sm font-semibold text-ink/60 hover:text-ember transition">Dealer Login</Link>
            )}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="w-8 h-8 rounded-full bg-red-gradient text-white flex items-center justify-center text-xs font-bold">
                    {(user.name || user.mobile || 'U')[0].toUpperCase()}
                  </span>
                  {user.name || user.mobile}
                  <Chevron />
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 w-56 py-2 animate-fadeUp">
                    <Link to={isDealer ? '/dashboard/inventory' : '/dashboard/my-cars'} onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-red-gradient-soft">
                      {isDealer ? 'My Inventory' : 'My Cars'}
                    </Link>
                    {!isDealer && <Link to="/dashboard/wishlist" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-red-gradient-soft">Wishlist</Link>}
                    {isDealer && <Link to="/dashboard/leads" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-red-gradient-soft">Leads</Link>}
                    <Link to="/dashboard/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-sm hover:bg-red-gradient-soft">Profile</Link>
                    <button onClick={() => { dispatch(logout()); setUserMenu(false); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-ember font-semibold hover:bg-red-gradient-soft">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="bg-red-gradient hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-card">
                Login
              </button>
            )}
          </div>

          <button className="lg:hidden text-ink" onClick={() => setMobileOpen(true)}><Menu /></button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-white p-6 lg:hidden animate-fadeUp">
          <div className="flex justify-between items-center mb-8">
            <span className="font-display font-black text-2xl">4tyre<span className="text-gradient">zz</span></span>
            <button onClick={() => setMobileOpen(false)}><Close /></button>
          </div>
          <nav className="flex flex-col gap-5 text-lg font-semibold">
            <Link to="/cars" onClick={() => setMobileOpen(false)}>Buy Used Car</Link>
            <Link to="/cars?bodyType=SUV" onClick={() => setMobileOpen(false)}>SUVs</Link>
            <Link to="/cars?fuel=Electric" onClick={() => setMobileOpen(false)}>Electric Cars</Link>
            {user ? (
              <>
                <Link to={isDealer ? '/dashboard/inventory' : '/dashboard/my-cars'} onClick={() => setMobileOpen(false)}>{isDealer ? 'My Inventory' : 'My Cars'}</Link>
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
