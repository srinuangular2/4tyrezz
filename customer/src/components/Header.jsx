import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/authSlice';
import { Menu, Close, Chevron, Heart } from './icons';
import OtpLoginModal from './OtpLoginModal';

export default function Header() {
  const { user } = useSelector((s) => s.auth);
  const wishlistCount = useSelector((s) => s.wishlist?.ids?.length || 0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  // Dynamic API State for Locations
  const [locationsList, setLocationsList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  const dropdownRef = useRef(null);

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
        const response = await fetch('http://localhost:5000/api/cities'); 
        
        if (response.ok) {
          const json = await response.json();
          const data = Array.isArray(json) ? json : json.data || [];
          let parsedLocations = [];

          if (Array.isArray(data) && data.length > 0) {
            const hyderabadData = data.find(
              (c) => c && typeof c === 'object' && c.name && c.name.toLowerCase() === 'hyderabad'
            );

            if (hyderabadData && Array.isArray(hyderabadData.areas) && hyderabadData.areas.length > 0) {
              parsedLocations = hyderabadData.areas.map((area) => {
                const areaName = typeof area === 'string' ? area : area.name || area.title || String(area);
                return `${areaName}, Hyderabad`;
              });
            } else {
              parsedLocations = data.map((c) => (typeof c === 'string' ? c : c.name || c.city || 'Hyderabad'));
            }
          }

          if (parsedLocations.length > 0) {
            setLocationsList(parsedLocations);
            setSelectedLocation(parsedLocations[0]);
          } else {
            const defaults = ['Hyderabad', 'Gachibowli, Hyderabad', 'Madhapur, Hyderabad', 'Kukatpally, Hyderabad'];
            setLocationsList(defaults);
            setSelectedLocation(defaults[0]);
          }
        } else {
          throw new Error(`Server returned status: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to load dynamic locations from DB, using fallback list:', error);
        const defaults = ['Hyderabad', 'Gachibowli, Hyderabad', 'Madhapur, Hyderabad', 'Kukatpally, Hyderabad', 'Banjara Hills, Hyderabad'];
        setLocationsList(defaults);
        setSelectedLocation(defaults[0]);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocationsFromApi();
  }, []);

  const navLinks = [
    { label: 'Buy Cars', path: '/cars' },
    { label: 'Sell / Exchange Car', path: '/sell' },
    { label: 'Compare', path: '/compare' },
    { label: 'Finance', path: '/finance' },
    { label: 'Insurance', path: '/insurance' },
    { label: 'Dealers', path: '/dealers' },
    { label: 'Offers', path: '/offers', badge: 'HOT' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedLocation) params.set('location', selectedLocation);
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <>
      <header className="sticky bg-white w-full top-0 z-50 border-b border-slate-200 shadow-xs">
        
        {/* ================= TOP HEADER BAR ================= */}
        <div className="border-b border-slate-100 p-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4 h-18 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link to="/" className="font-display font-bold text-2xl tracking-tight shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 110" className="h-10 w-auto">
                <g transform="translate(10, 5)">
                  <rect width="100" height="100" rx="22" fill="#3083ff" />
                  <path d="M 18 52 A 32 32 0 0 1 82 52" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="36" cy="36" r="4.5" fill="#FFFFFF" />
                  <path d="M 28 52 C 28 44 44 44 44 52" fill="#FFFFFF" />
                  <circle cx="50" cy="40" r="3.5" fill="#fff" />
                  <path d="M 44 52 C 44 46 56 46 56 52" fill="#fff" />
                  <circle cx="64" cy="36" r="4.5" fill="#FFFFFF" />
                  <path d="M 56 52 C 56 44 72 44 72 52" fill="#FFFFFF" />
                  <path d="M 22 62 Q 50 74 78 62" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="22" cy="78" r="6" fill="#fff" stroke="#3083ff" strokeWidth="2" />
                  <circle cx="40" cy="78" r="6" fill="#fff" stroke="#3083ff" strokeWidth="2" />
                  <circle cx="60" cy="78" r="6" fill="#fff" stroke="#3083ff" strokeWidth="2" />
                  <circle cx="78" cy="78" r="6" fill="#fff" stroke="#3083ff" strokeWidth="2" />
                </g>
                <text x="128" y="62" fontFamily="system-ui, -apple-system, sans-serif" fontSize="44" fontWeight="900" fill="#0F172A" letterSpacing="-1">
                  4TYREZZ<tspan fill="#3083ff">.</tspan>
                </text>
                <text x="130" y="84" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="500" fill="#64748B">
                  Verified Pre-Owned Cars
                </text>
              </svg>
            </Link>

            {/* Dynamic Search Bar with Custom Floating Location Dropdown */}
            <form
              onSubmit={handleSearchSubmit}
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
                    {locationsList.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium transition flex items-center gap-2 ${
                          selectedLocation === loc
                            ? 'bg-blue-50 text-[#3083ff] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>📍</span>
                        <span className="truncate">{loc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Search Input */}
              <div className="relative flex-1 flex items-center px-3">
                <svg className="w-4 h-4 text-slate-400 shrink-0 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Make, Model, or Keyword..."
                  className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="text-white text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer hover:bg-slate-100"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-5 h-5 text-slate-500"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>

            {/* Actions: Wishlist, Phone, Auth */}
            <div className="hidden lg:flex items-center gap-5 shrink-0">
              {!isDealer && (
                <Link
                  to={isUser ? '/dashboard/wishlist' : '#'}
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
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 w-52 py-2 z-50 animate-fadeUp">
                      {isDealer && (
                        <>
                          <Link to="/dashboard/inventory" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">My Inventory</Link>
                          <Link to="/dashboard/add-car" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Add Car</Link>
                          <Link to="/dashboard/leads" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Leads</Link>
                        </>
                      )}
                      {isUser && (
                        <Link to="/dashboard/wishlist" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
                        </Link>
                      )}
                      <Link to="/dashboard/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Profile</Link>
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
                    <span className="bg-[#fe0100] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">
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
            <span className="font-display font-black text-2xl text-slate-900">
              4TYREZZ<span className="text-[#3083ff]">.</span>
            </span>
            <button onClick={() => setMobileOpen(false)} className="p-2">
              <Close />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="mb-6 space-y-3">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
            >
              {locationsList.map((loc, i) => (
                <option key={i} value={loc}>
                  📍 {loc}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Make, Model, or Keyword..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800"
            />

            <button
              type="submit"
              className="w-full bg-[#3083ff] text-white font-black py-3 rounded-xl text-xs uppercase"
            >
              Search
            </button>
          </form>

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
                  <span className="bg-[#fe0100] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="border-t border-slate-100 pt-4 mt-2">
              {user ? (
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
    </>
  );
}