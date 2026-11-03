import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import { Menu, Close, Heart } from './icons';
import {
  BadgePercent,
  Car,
  ChevronRight,
  ClipboardCheck,
  Gauge,
  IndianRupee,
  Landmark,
  Phone,
  ShieldCheck,
  ShoppingCart,
  Columns2,
  UserRound,
} from 'lucide-react';
import { readCart, subscribeCart } from '../lib/cart';
import { mediaUrl } from '../pages/profile/hubUtils';
import OtpLoginModal from './OtpLoginModal';
import HeaderSearchBar, { MobileSearchButton } from './common/HeaderSearchBar';
import api from '../api/axios';
import NotificationBell from './NotificationBell';
import { SHOW_TEST_DRIVE } from '../lib/featureFlags';

export default function Header() {
  const { user } = useSelector((s) => s.auth);
  const wishlistCount = useSelector((s) => s.wishlist?.ids?.length || 0);
  const [cartCount, setCartCount] = useState(() => readCart().length);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [showLogin, setShowLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  // Dynamic API State for Locations
  const PLACE_KEY = '4tyrezz:place';
  const [locationsList, setLocationsList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [mobileSearch, setMobileSearch] = useState(false);
  const dropdownRef = useRef(null);
  const searchPillRef = useRef(null);

  const isDealer = user?.role === 'dealer';
  const isUser = user && !isDealer;
  const avatarSrc = mediaUrl(user?.avatar);
  const avatarLetter = (user?.name || user?.mobile || 'U')[0].toUpperCase();

  useEffect(() => subscribeCart((rows) => setCartCount(rows.length)), []);

  // Close location dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 100% Dynamic API Fetch with Safe Fallbacks
  useEffect(() => {
    const fetchLocationsFromApi = async () => {
      try {
        setIsLoadingLocations(true);
        const { data } = await api.get('/locations/active-cities');
        const cities = data.cities || [];
        const areaSets = await Promise.all(
          cities.slice(0, 6).map((c) => api.get('/locations/areas', { params: { city: c.name } }).then((r) => r.data.areas || []).catch(() => []))
        );
        const areas = areaSets.flat();
        const parsed = [
          ...cities.map((c) => ({
            label: c.state ? `${c.name}, ${c.state}` : c.name,
            city: c.name,
            area: '',
            state: c.state || '',
            count: c.count || 0,
          })),
          ...areas.map((a) => ({
            label: [a.name, a.city, a.state].filter(Boolean).join(', '),
            city: a.city,
            area: a.name,
            state: a.state || '',
            count: a.count || 0,
          })),
        ].filter((row) => row.city || row.area);

        if (parsed.length > 0) {
          setLocationsList(parsed);
          try {
            const saved = JSON.parse(localStorage.getItem(PLACE_KEY) || 'null');
            if (saved?.label && parsed.some((p) => p.label === saved.label)) {
              setSelectedLocation(saved.label);
            } else {
              setSelectedLocation(parsed[0].label);
            }
          } catch {
            setSelectedLocation(parsed[0].label);
          }
        } else {
          setLocationsList([]);
        }
      } catch (error) {
        console.error('Failed to load live locations:', error);
        setLocationsList([]);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocationsFromApi();
  }, []);

  const navLinks = [
    { label: 'Buy Used Cars', path: '/cars', icon: Car, primary: true },
    { label: 'Sell My Car', path: '/sell', icon: IndianRupee, primary: true },
    { label: 'Car Valuation', path: '/valuation', icon: Gauge, primary: true },
    { label: 'Car Inspection', path: '/inspection', icon: ClipboardCheck, primary: true },
    { label: 'Compare', path: '/compare', icon: Columns2 },
    { label: 'Finance', path: '/finance', icon: Landmark },
    { label: 'Insurance', path: '/insurance', icon: ShieldCheck },
    { label: 'Offers', path: '/offers', icon: BadgePercent, badge: 'HOT' },
    { label: 'Contact', path: '/contact', icon: Phone },
  ];
  const primaryLinks = navLinks.filter((item) => item.primary);
  const moreLinks = navLinks.filter((item) => !item.primary);

  const isNavActive = (path) => {
    if (path === '/cars') {
      return pathname === '/cars' || pathname === '/buy-cars' || pathname.startsWith('/cars/');
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <header className="sticky bg-white w-full top-0 z-50 border-b border-slate-200 shadow-xs">
        
        {/* ================= TOP HEADER BAR ================= */}
        <div className="lg:border-b lg:border-slate-100 lg:p-2">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 lg:h-[4.5rem] flex items-center gap-2 lg:gap-4">
            <button className="lg:hidden text-slate-900 p-1.5 shrink-0" aria-label="Menu" onClick={() => setMobileOpen(true)}>
              <Menu />
            </button>

            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src="/blue-logo.png" alt="4TYREZZ" className="h-9 lg:h-20 w-auto" />
            </Link>

            {/* Dynamic Search Bar with Custom Floating Location Dropdown */}
            <div
              ref={searchPillRef}
              className="hidden md:flex items-center flex-1 max-w-xl mx-4 bg-slate-50 border border-slate-300 rounded-full p-1 focus-within:border-[#3083ff] transition-all relative z-40"
            >
              {/* Custom Location Dropdown Container */}
              <div className="relative shrink-0 border-r border-slate-200" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
                  disabled={isLoadingLocations}
                  className="bg-transparent text-xs font-extrabold text-slate-800 py-2 pl-3 pr-6 focus:outline-none flex items-center gap-1 max-w-[170px] truncate cursor-pointer"
                >
                  <span className="truncate">📍 {isLoadingLocations ? 'Loading...' : selectedLocation}</span>
                  <span className="text-[9px] text-slate-500">▼</span>
                </button>

                {/* Floating Dropdown List */}
                {isLocationDropdownOpen && !isLoadingLocations && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 py-1.5 animate-fadeIn">
                    {locationsList.map((loc) => (
                      <button
                        key={loc.label}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc.label);
                          localStorage.setItem(PLACE_KEY, JSON.stringify(loc));
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium transition flex items-center gap-2 ${
                          selectedLocation === loc.label
                            ? 'bg-blue-50 text-[#3083ff] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>📍</span>
                        <span className="truncate flex-1">{loc.label}</span>
                        {loc.count ? <span className="text-[10px] text-slate-400">{loc.count}</span> : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <HeaderSearchBar city={selectedLocation} anchorRef={searchPillRef} />
            </div>

            {/* Actions: Wishlist, Phone, Auth */}
            <div className="hidden lg:flex items-center gap-5 shrink-0">
              {isUser && (
                <Link
                  to="/profile/wishlist"
                  className="relative text-slate-700 hover:text-[#3083ff] transition p-1"
                  aria-label="Wishlist"
                >
                  <Heart className="w-6 h-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#3083ff] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              {!user && (
                <Link
                  to="#"
                  onClick={() => setShowLogin(true)}
                  className="relative text-slate-700 hover:text-[#3083ff] transition p-1"
                  aria-label="Wishlist"
                >
                  <Heart className="w-6 h-6" />
                </Link>
              )}

              <a
                href="tel:+917993980559"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-[#3083ff] text-white flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase text-slate-400">Call Now</span>
                  <span className="text-xs font-black text-slate-900">+91 79939 80559</span>
                </div>
              </a>

              <Link to="/profile/cart" className="relative text-slate-700 hover:text-[#3083ff] transition p-1" aria-label="Cart">
                <ShoppingCart className="w-6 h-6" strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#3083ff] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isUser && <NotificationBell variant="customer" />}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenu((v) => !v)}
                    className="w-9 h-9 rounded-full overflow-hidden bg-[#3083ff] text-white flex items-center justify-center text-sm font-black cursor-pointer"
                    aria-label="Account"
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                    ) : (
                      avatarLetter
                    )}
                  </button>

                  {userMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 w-56 py-2 z-50 animate-fadeUp">
                      {isUser && (
                        <>
                          <Link to="/profile/settings" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Profile</Link>
                          <Link to="/profile/orders" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Orders</Link>
                          <Link to="/profile/my-vehicles" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Vehicles</Link>
                          <Link to="/profile/cart" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            My Cart {cartCount > 0 ? `(${cartCount})` : ''}
                          </Link>
                          <Link to="/profile/enquiries" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Enquiries</Link>
                          <Link to="/profile/wishlist" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
                          </Link>
                          <Link to="/profile/saved-searches" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Saved Searches</Link>
                          <Link to="/profile/comparisons" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Comparisons</Link>
                          {SHOW_TEST_DRIVE && (
                            <Link to="/profile/test-drives" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Test Drives</Link>
                          )}
                          <Link to="/profile/finance-applications" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Finance Applications</Link>
                          <Link to="/profile/insurance-enquiries" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Insurance Enquiries</Link>
                          <Link to="/profile/notifications" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Notifications</Link>
                          <Link to="/profile/support-tickets" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Support Tickets</Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          dispatch(logout());
                          setUserMenu(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#3083ff] hover:bg-slate-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-[#3083ff] hover:bg-[#1853ff] text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                >
                  Login / Register
                </button>
              )}
            </div>

            <div className="lg:hidden ml-auto flex items-center gap-0.5">
              <MobileSearchButton onClick={() => setMobileSearch(true)} />
              <Link
                to={user ? '/profile/wishlist' : '#'}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    setShowLogin(true);
                  }
                }}
                className="relative min-w-11 min-h-11 flex items-center justify-center text-slate-800 active:scale-95 transition-transform"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#3083ff] text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link to="/profile/cart" className="relative min-w-11 min-h-11 flex items-center justify-center text-slate-800" aria-label="Cart">
                <ShoppingCart className="w-5 h-5" strokeWidth={2.2} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#3083ff] text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to={user ? '/profile' : '#'}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    setShowLogin(true);
                  }
                }}
                className="min-w-11 min-h-11 flex items-center justify-center text-slate-800"
                aria-label="Profile"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <UserRound className="h-5 w-5" strokeWidth={2.2} />
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM NAVIGATION BAR ================= */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4 h-12 flex items-center justify-between">
            <nav className="flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
              {navLinks.map((item) => {
                const active = isNavActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-1.5 py-3 border-b-2 transition-colors ${
                      active
                        ? 'text-[#3083ff] border-[#3083ff]'
                        : 'text-slate-800 border-transparent hover:text-[#3083ff] hover:border-[#3083ff]'
                    }`}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="bg-[#3083ff] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

      </header>

      {/* ================= MOBILE DRAWER ================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#f6f8fb] lg:hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <img src="/blue-logo.png" alt="4TYREZZ" className="h-9 w-auto" />
            <button type="button" onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600" aria-label="Close menu">
              <Close />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <p className="text-[12px] font-medium text-slate-500">What do you want to do?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {primaryLinks.map((item) => {
                const active = isNavActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-2xl border px-3 py-3 ${
                      active ? 'border-[#3083ff] bg-[#f4f8ff]' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#3083ff] text-white' : 'bg-[#eaf2ff] text-[#3083ff]'}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className={`text-[13px] leading-tight ${active ? 'font-semibold text-[#1853ff]' : 'font-medium text-slate-800'}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <p className="mt-5 text-[12px] font-medium text-slate-500">More</p>
            <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {moreLinks.map((item, index) => {
                const active = isNavActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-3 ${index ? 'border-t border-slate-100' : ''} ${active ? 'bg-[#f4f8ff]' : ''}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf2ff] text-[#3083ff]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className={`flex-1 text-[14px] ${active ? 'font-semibold text-[#1853ff]' : 'font-medium text-slate-800'}`}>{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-[#3083ff] px-2 py-0.5 text-[10px] font-semibold text-white">{item.badge}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {user && !isUser ? (
              <button
                type="button"
                onClick={() => {
                  dispatch(logout());
                  setMobileOpen(false);
                  navigate('/');
                }}
                className="h-11 w-full rounded-xl border border-slate-200 text-[14px] font-semibold text-[#3083ff]"
              >
                Log out
              </button>
            ) : user && isUser ? (
              <>
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#3083ff] text-[13px] font-semibold text-white">
                    {avatarSrc ? <img src={avatarSrc} alt="" className="h-full w-full object-cover" /> : avatarLetter}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-slate-900">{user.name || 'My account'}</span>
                    <span className="block text-[12px] font-normal text-slate-500">{user.mobile ? `+91 ${user.mobile}` : 'Signed in'}</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Account', '/profile', UserRound],
                    ['Orders', '/profile/orders', ClipboardCheck],
                    ['Cart', '/profile/cart', ShoppingCart],
                  ].map(([label, path, Icon]) => (
                    <Link key={path} to={path} onClick={() => setMobileOpen(false)} className="rounded-xl border border-slate-200 py-2 text-center">
                      <Icon className="mx-auto h-4 w-4 text-[#3083ff]" strokeWidth={1.75} />
                      <span className="mt-1 block text-[12px] font-medium text-slate-700">{label}{label === 'Cart' && cartCount > 0 ? ` ${cartCount}` : ''}</span>
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(logout());
                    setMobileOpen(false);
                    navigate('/');
                  }}
                  className="mt-2 w-full py-2 text-center text-[13px] font-medium text-[#3083ff]"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setShowLogin(true);
                }}
                className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      )}

      {showLogin && <OtpLoginModal onClose={() => setShowLogin(false)} />}
      <HeaderSearchBar
        variant="modal"
        open={mobileSearch}
        onClose={() => setMobileSearch(false)}
        city={selectedLocation}
      />
    </>
  );
}