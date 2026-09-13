import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import { Menu, Close, Chevron, Heart } from './icons';
import OtpLoginModal from './OtpLoginModal';
import HeaderSearchBar, { MobileSearchButton } from './common/HeaderSearchBar';
import api from '../api/axios';
import NotificationBell from './NotificationBell';
import { SHOW_TEST_DRIVE } from '../lib/featureFlags';

export default function Header() {
  const { user } = useSelector((s) => s.auth);
  const wishlistCount = useSelector((s) => s.wishlist?.ids?.length || 0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    { label: 'Buy Cars', path: '/cars' },
    { label: 'Sell / Exchange Car', path: '/sell' },
    { label: 'Valuation', path: '/valuation' },
    { label: 'Compare', path: '/compare' },
    { label: 'Finance', path: '/finance' },
    { label: 'Insurance', path: '/insurance' },
    { label: 'Dealers', path: '/dealers' },
    { label: 'Offers', path: '/offers', badge: 'HOT' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header className="sticky bg-white w-full top-0 z-50 border-b border-slate-200 shadow-xs">
        
        {/* ================= TOP HEADER BAR ================= */}
        <div className="border-b border-slate-100 p-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4 h-18 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src="/blue-logo.png" alt="4TYREZZ" className="h-20 w-auto" />
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
              {!isDealer && (
                <Link
                  to={isUser ? '/profile/wishlist' : '#'}
                  onClick={() => !user && setShowLogin(true)}
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

              <a
                href="tel:+919160415851"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-[#3083ff] text-white flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase text-slate-400">Call Now</span>
                  <span className="text-xs font-black text-slate-900">+91 91604 15851</span>
                </div>
              </a>

              {(isDealer || isUser) && <NotificationBell variant="dealer" />}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenu((v) => !v)}
                    className="flex items-center gap-2 text-xs font-bold bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl hover:border-slate-300 transition cursor-pointer"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      {(user.name || user.mobile || 'U')[0].toUpperCase()}
                    </span>
                    <span className="max-w-[90px] truncate">{user.name || user.mobile}</span>
                    <Chevron className="w-3 h-3" />
                  </button>

                  {userMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 w-56 py-2 z-50 animate-fadeUp">
                      {isDealer && (
                        <>
                          <Link to="/dealer/dashboard" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Dashboard</Link>
                          <Link to="/dealer/onboarding" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Onboarding / KYC</Link>
                          <Link to="/dealer/dashboard/inventory" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Inventory</Link>
                          <Link to="/dealer/dashboard/inventory/add" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Add Car</Link>
                          <Link to="/dealer/dashboard/leads" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Leads</Link>
                          <Link to="/dealer/dashboard/settings" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Profile</Link>
                        </>
                      )}
                      {isUser && (
                        <>
                          <Link to="/profile/settings" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Profile</Link>
                          <Link to="/profile/enquiries" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Enquiries</Link>
                          <Link to="/profile/wishlist" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
                          </Link>
                          <Link to="/profile/saved-searches" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Saved Searches</Link>
                          <Link to="/profile/comparisons" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Comparisons</Link>
                          {SHOW_TEST_DRIVE && (
                            <Link to="/profile/test-drives" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Test Drives</Link>
                          )}
                          <Link to="/profile/bookings" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Bookings</Link>
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

            <MobileSearchButton onClick={() => setMobileSearch(true)} />
            {(isDealer || isUser) && (
              <div className="lg:hidden">
                <NotificationBell variant="dealer" />
              </div>
            )}
            <button className="lg:hidden text-slate-900 p-2" onClick={() => setMobileOpen(true)}>
              <Menu />
            </button>
          </div>
        </div>

        {/* ================= BOTTOM NAVIGATION BAR ================= */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4 h-12 flex items-center justify-between">
            <nav className="flex items-center gap-6 text-xs font-bold text-slate-800 uppercase tracking-wide">
              {navLinks.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className="hover:text-[#3083ff] transition-colors flex items-center gap-1.5 py-3 border-b-2 border-transparent hover:border-[#3083ff]"
                >
                  {item.label}
                  {item.badge && (
                    <span className="bg-[#3083ff] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>

      </header>

      {/* ================= MOBILE DRAWER ================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-white p-6 lg:hidden animate-fadeUp overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <img src="/blue-logo.png" alt="4TYREZZ" className="h-10 w-auto" />
            <button onClick={() => setMobileOpen(false)} className="p-2">
              <Close />
            </button>
          </div>

          <div className="mb-6 space-y-3">
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                const hit = locationsList.find((row) => row.label === e.target.value);
                if (hit) localStorage.setItem(PLACE_KEY, JSON.stringify(hit));
              }}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
            >
              {locationsList.map((loc) => (
                <option key={loc.label} value={loc.label}>
                  📍 {loc.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setMobileSearch(true);
              }}
              className="w-full bg-[#3083ff] text-white font-black py-3 rounded-xl text-xs uppercase"
            >
              Search cars
            </button>
          </div>

          <nav className="flex flex-col gap-4 text-base font-bold text-slate-800">
            {navLinks.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-1 hover:text-[#3083ff]"
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-[#3083ff] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="border-t border-slate-100 pt-4 mt-2">
              {user ? (
                <>
                  {isUser && (
                    <Link
                      to="/profile/settings"
                      onClick={() => setMobileOpen(false)}
                      className="block text-slate-800 font-black py-2"
                    >
                      My Account
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      dispatch(logout());
                      setMobileOpen(false);
                      navigate('/');
                    }}
                    className="text-left text-[#3083ff] font-black py-2 w-full"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setShowLogin(true);
                  }}
                  className="w-full bg-[#3083ff] text-white text-center font-black py-3 rounded-xl"
                >
                  Login / Register
                </button>
              )}
            </div>
          </nav>
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