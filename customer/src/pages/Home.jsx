import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import CarCard from '../components/CarCard';
import { CarGridSkeleton } from '../components/Skeletons';
import HeroCarousel from '../components/HeroCarousel';
import QuickServices from '../components/QuickServices';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import SellCarCTA from '../components/SellCarCTA';
import FinanceCTA from '../components/FinanceCTA';
import TestimonialCard from '../components/TestimonialCard';
import FaqsSection from '../components/FaqsSection';
import HowItWorks from '../components/HowItWorks';
import CarBannerSection from '../components/CarBannerSection';
import WhatsAppFloat from '../components/WhatsAppFloat';
import LastViewedCars from '../components/LastViewedCars';
import { Car, BadgeCheck, Scale, GitCompare, Banknote, Shield, Tag, Phone } from 'lucide-react';
import CompareVsCard from '../components/CompareVsCard';
import { mediaUrl } from './profile/hubUtils';
import { BUDGETS, budgetQuery } from '../utils/filterOptions';
import { formatKm, formatPrice } from '../utils/format';
import 'swiper/css';
import 'swiper/css/navigation';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const TRANSMISSION_TYPES = ['Manual', 'Automatic'];

const BODY_TYPES = [
  { name: 'Hatchback', icon: '🚗' },
  { name: 'Sedan', icon: '🚘' },
  { name: 'SUV', icon: '🚙' },
  { name: 'MUV', icon: '🚐' }
];

function Section({ eyebrow, title, viewAllHref, children, bg, className = '' }) {
  const renderFormattedTitle = (content) => {
    if (!content) return null;
    
    // If title is already JSX (e.g. <>FEATURED <span className="font-black">CARS</span></>), render it directly
    if (typeof content !== 'string') {
      return content;
    }

    const words = content.trim().split(' ');
    if (words.length <= 1) return <span className="font-normal">{content}</span>;
    
    const lastWord = words.pop();
    const mainText = words.join(' ');
    
    return (
      <span className="font-normal text-slate-800">
        {mainText} <span className="font-black text-slate-900">{lastWord}</span>
      </span>
    );
  };

  return (
    <section className={`${bg ? 'bg-white' : ''} py-5 lg:py-16 ${className}`}>
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
        {(eyebrow || title || viewAllHref) && (
          <div className="flex items-center justify-between gap-3 mb-3 lg:items-end lg:pb-3 lg:mb-5 lg:border-b lg:border-slate-100">
            <div className="min-w-0">
              {eyebrow && (
                <p className="hidden sm:block text-[14px] font-medium text-[#909294] uppercase tracking-[5px] font-display mb-3">
                  {eyebrow}
                </p>
              )}
              {title && (
                <>
                  <h2 className="lg:hidden text-[17px] font-black text-slate-900 tracking-tight normal-case">
                    {typeof title === 'string' ? title : title}
                  </h2>
                  <h2 className="hidden lg:block text-4xl uppercase tracking-tight font-display">
                    {renderFormattedTitle(title)}
                  </h2>
                </>
              )}
            </div>
            {viewAllHref && (
              <Link
                to={viewAllHref}
                className="shrink-0 text-[13px] font-bold text-[#3083ff] lg:inline-flex lg:items-center lg:gap-1.5 lg:text-sm lg:font-semibold lg:text-black lg:uppercase lg:tracking-wider"
              >
                <span className="lg:hidden">View all</span>
                <span className="hidden lg:inline">View All</span>
                <svg
                  className="hidden lg:inline w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { brands } = useReferenceData();
  const [latest, setLatest] = useState([]);
  const [premium, setPremium] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Widget States
  const [filterMode, setFilterMode] = useState('budget');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedBody, setSelectedBody] = useState('');

  const brandPrevRef = useRef(null);
  const brandNextRef = useRef(null);
  const testPrevRef = useRef(null);
  const testNextRef = useRef(null);
  const displayedBrands = brands.slice(0, 12);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/cars', { params: { sort: '-createdAt', limit: 10 } }).catch(() => ({ data: { cars: [] } })),
      api.get('/cars', { params: { minPrice: 1500000, limit: 10, sort: '-createdAt' } }).catch(() => ({ data: { cars: [] } })),
    ]).then(([l, p]) => {
      if (cancelled) return;
      setLatest(l.data?.cars || []);
      setPremium(p.data?.cars || []);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (filterMode === 'budget' && selectedBudget !== '') {
      const q = budgetQuery(BUDGETS[selectedBudget] || {});
      Object.entries(q).forEach(([k, v]) => params.set(k, v));
    } else if (filterMode === 'brand' && selectedBrand) {
      params.set('brand', selectedBrand);
    }
    if (selectedBody) params.set('bodyType', selectedBody);
    navigate(`/cars?${params.toString()}`);
  };

  const menuCards = [
    { label: 'Buy Used Cars', hint: 'Inspected cars near you', path: '/cars', icon: Car },
    { label: 'Sell My Car', hint: 'Doorstep evaluation', path: '/sell', icon: BadgeCheck },
    { label: 'Car Valuation', hint: 'Know a fair price', path: '/valuation', icon: Scale },
    { label: 'Compare', hint: 'See cars side by side', path: '/compare', icon: GitCompare },
    { label: 'Finance', hint: 'EMI on used cars', path: '/finance', icon: Banknote },
    { label: 'Insurance', hint: 'Paperless cover', path: '/insurance', icon: Shield },
    { label: 'Offers', hint: 'Deals on live stock', path: '/offers', icon: Tag, badge: 'HOT' },
    { label: 'Contact', hint: 'Talk to 4tyrezz', path: '/contact', icon: Phone },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased selection:bg-[#3083ff] selection:text-white">
      {/* ---- HERO SECTION ---- */}
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="w-full relative z-0">
          <HeroCarousel />
        </div>

        {/* Search Panel Overlaid on the Left */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center hidden">
          <div className="container-px mx-auto px-4 sm:px-6 lg:px-12 w-full">
            <div className="pointer-events-auto max-w-sm sm:max-w-md bg-white/90 backdrop-blur-md border border-white/80 rounded-2xl p-6 sm:p-7 shadow-2xl">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-4">
                Find your right used car
              </h1>

              <div className="flex items-center gap-6 mb-4 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filterMode"
                    value="budget"
                    checked={filterMode === 'budget'}
                    onChange={() => setFilterMode('budget')}
                    className="accent-[#3083ff] w-4 h-4 cursor-pointer"
                  />
                  <span>By Budget</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filterMode"
                    value="brand"
                    checked={filterMode === 'brand'}
                    onChange={() => setFilterMode('brand')}
                    className="accent-[#3083ff] w-4 h-4 cursor-pointer"
                  />
                  <span>By Brand</span>
                </label>
              </div>

              <form onSubmit={handleSearch} className="space-y-3">
                {filterMode === 'budget' ? (
                  <div>
                    <select
                      value={selectedBudget}
                      onChange={(e) => setSelectedBudget(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-none focus:border-[#3083ff] focus:ring-1 focus:ring-[#3083ff] shadow-xs cursor-pointer"
                    >
                      <option value="">Select Budget</option>
                      {BUDGETS.map((b, i) => (
                        <option key={b.label} value={i}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-none focus:border-[#3083ff] focus:ring-1 focus:ring-[#3083ff] shadow-xs cursor-pointer"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <select
                    value={selectedBody}
                    onChange={(e) => setSelectedBody(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-none focus:border-[#3083ff] focus:ring-1 focus:ring-[#3083ff] shadow-xs cursor-pointer"
                  >
                    <option value="">All Vehicle Types</option>
                    {BODY_TYPES.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: '#3083ff' }}
                  className="w-full hover:brightness-90 text-white font-black rounded-xl py-3.5 transition-all text-sm cursor-pointer shadow-lg uppercase tracking-wide mt-2"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="lg:hidden px-3 pt-4 bg-slate-50">
        <h2 className="text-[17px] font-black text-slate-900 mb-3">Our services</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {menuCards.map(({ label, hint, path, icon: Icon, badge }) => (
            <Link
              key={path}
              to={path}
              className="relative p-3.5 rounded-2xl bg-gradient-to-br from-[#0c2e68] to-[#1853ff] border border-[#3083ff]/30 h-[118px] flex flex-col justify-between"
            >
              <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white">
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              </span>
              {badge && (
                <span className="absolute top-3 right-3 text-[8px] font-black text-[#1853ff] bg-white px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
              <span>
                <span className="block text-white font-extrabold text-[13px] leading-tight">{label}</span>
                <span className="block text-blue-100/80 text-[11px] mt-0.5">{hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- KEY METRICS ---- */}
      <section className="hidden lg:block py-16 bg-white">
        <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
          <QuickServices />
        </div>
      </section>

      <LastViewedCars />

      {/* ---- LATEST CARS ---- */}
      <Section
        className="bg-gradient-to-b from-blue-50/70"
        eyebrow="Fresh Listings"
        title={<>Latest <span className="font-black"> Used Cars</span></>}
        viewAllHref="/cars?sort=-createdAt"
      >
        {loading ? <CarGridSkeleton /> : <CarSlider cars={latest} />}
      </Section>
      <BudgetCarsByTabs />

   

      {/* ---- PREMIUM CARS (price ≥ ₹15 Lakh, not isFeatured) ---- */}
      <Section
        className="bg-gradient-to-b from-blue-50/70"
        eyebrow="Above ₹15 Lakh"
        title={<>Premium <span className="font-black"> Cars</span></>}
        viewAllHref="/cars?minPrice=1500000"
      >
        {loading ? <CarGridSkeleton /> : <CarSlider cars={premium} />}
      </Section>

     

      {/* ---- POPULAR BRANDS ---- */}
      <Section eyebrow="all brands" title="Popular Brands" bg>
  <div className="flex flex-col gap-8">
    {/* Top 12 Brands Glassmorphism Grid */}
    <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {displayedBrands.slice(0, 12).map((b) => (
        <Link
          key={`m-${b._id}`}
          to={`/cars?brand=${b._id}`}
          className="shrink-0 w-[78px] h-[78px] rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center gap-1 px-1"
        >
          {b.logo ? (
            <img src={mediaUrl(b.logo)} alt="" className="h-7 max-w-[48px] object-contain" />
          ) : (
            <span className="text-[11px] font-black text-[#3083ff]">{b.name.slice(0, 2).toUpperCase()}</span>
          )}
          <span className="text-[10px] font-semibold text-slate-700 line-clamp-1">{b.name}</span>
        </Link>
      ))}
    </div>
    <div className="hidden lg:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {displayedBrands.slice(0, 12).map((b) => (
        <Link
          key={b._id}
          to={`/cars?brand=${b._id}`}
          className="group relative flex flex-col items-center justify-center gap-3 p-5 h-32 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_16px_32px_0_rgba(37,99,235,0.18)] hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
          {/* Subtle Radiant Top Accent Beam on Hover */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Logo Container */}
          <div className="h-10 w-full flex items-center justify-center">
            {b.logo ? (
              <img
                src={mediaUrl(b.logo)}
                alt={b.name}
                className="max-h-10 max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-slate-900/5 border border-slate-900/10 flex items-center justify-center text-xs font-black text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                {b.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Brand Name */}
          <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors duration-300 tracking-tight line-clamp-1">
            {b.name}
          </span>
        </Link>
      ))}
    </div>

    {/* View All Brands CTA Button */}
    <div className="hidden lg:flex justify-center mt-2">
      <Link
        to="/brands"
        className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900/90 text-white font-bold text-sm backdrop-blur-md border border-white/20 shadow-lg hover:bg-blue-600 hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <span>View All Brands</span>
        <span className="text-base font-black transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  </div>
</Section>
<PopularComparisons />
      <CarBannerSection />


 

      {/* ---- BROWSE BY CATEGORY (fuel / body — budget lives in tabs above) ---- */}
      <Section eyebrow="Find Your Style" title="Browse By Category" className="bg-gradient-to-b from-blue-50/70">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CategoryBox
            title="By Fuel Type"
            badge="Engine"
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            items={FUEL_TYPES}
            onSelect={(i) => navigate(`/cars?fuel=${FUEL_TYPES[i]}`)}
          />
          <CategoryBox
            title="By Body Style"
            badge="Segment"
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
              </svg>
            }
            items={BODY_TYPES.map((b) => b.name)}
            onSelect={(i) => navigate(`/cars?bodyType=${BODY_TYPES[i].name}`)}
          />
          <CategoryBox
            title="By Transmission"
            badge="Gearbox"
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            items={TRANSMISSION_TYPES}
            onSelect={(i) => navigate(`/cars?transmission=${TRANSMISSION_TYPES[i]}`)}
          />
        </div>
      </Section>



        <div className='container-px mx-auto px-4 sm:px-6 lg:px-8'>
          <SellCarCTA/>
        </div>

{/* ---- 4-STEP VERIFICATION PROCESS ---- */}
<Section className='bg-white'>
        <HowItWorks/>
      </Section>

      {/* ---- FEATURED DEALERS SLIDER ---- */}
      {/* <Section eyebrow="Verified Partners"  title={<>our verified<span className="font-black">  Dealers</span></>} >
  <div className="relative px-2">
    <button
      ref={dealerPrevRef}
      aria-label="Previous dealers"
      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-2xl border border-white/80 bg-white/80 backdrop-blur-md text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all duration-300 shadow-lg flex items-center justify-center font-bold text-lg cursor-pointer"
    >
      ‹
    </button>
    <button
      ref={dealerNextRef}
      aria-label="Next dealers"
      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-2xl border border-white/80 bg-white/80 backdrop-blur-md text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all duration-300 shadow-lg flex items-center justify-center font-bold text-lg cursor-pointer"
    >
      ›
    </button>

    <Swiper
      modules={[Navigation, Autoplay]}
      spaceBetween={24}
      slidesPerView={1}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      onBeforeInit={(swiper) => {
        swiper.params.navigation.prevEl = dealerPrevRef.current;
        swiper.params.navigation.nextEl = dealerNextRef.current;
      }}
      navigation={{ prevEl: dealerPrevRef.current, nextEl: dealerNextRef.current }}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
      className="w-full !py-4"
    >
      {dealers.map((dealer) => (
        <SwiperSlide key={dealer._id || dealer.name} className="h-auto">
          <div className="group relative flex flex-col justify-between h-full p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-[0_20px_40px_0_rgba(48,131,255,0.18)] hover:border-[#3083ff]/50 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden">
            
             
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-[#3083ff] to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div>
               
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
                  {dealer.badge || 'Verified Partner'}
                </span>

                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <span className="text-amber-500 text-xs">★</span>
                  <span className="text-xs font-black text-amber-600">
                    {dealer.rating || '4.9'}
                  </span>
                </div>
              </div>
             
              <div className="flex items-center gap-4 my-2">
                <div className="relative w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 p-1 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {dealer.logo || dealer.image ? (
                    <img
                      src={mediaUrl(dealer.logo || dealer.image)}
                      alt={dealer.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#3083ff] to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-inner">
                      {dealer.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#3083ff] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                    ✓
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate group-hover:text-[#3083ff] transition-colors">
                    {dealer.name}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{dealer.city || dealer.location || 'Hyderabad'}</span>
                  </p>
                </div>
              </div>
            </div>

        
            <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">In Stock</span>
                <span className="font-extrabold text-sm text-slate-900">
                  {dealer.inventory || '25+ Vehicles'}
                </span>
              </div>

              <Link
                to={dealer._id ? `/dealers/${dealer._id}` : '/dealers'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white group-hover:bg-[#3083ff] text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>View Showroom</span>
                <span className="font-black group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
     </Section> */}


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
      <Section eyebrow="Insurance" title={<>Car Insurance <span className="font-black"> Help</span></>} >
        <FinanceCTA />
      </Section> 
    </div>

     

      {/* ---- FAQS ---- */}
      <Section className='bg-gradient-to-b from-blue-50/70'>
        <FaqsSection/>
      </Section>


 {/* ---- TESTIMONIALS ---- */}
 <Section bg>
      <TestimonialCard />
      </Section>

     

      <WhatsAppFloat/>
    </div>
  );
}

function PopularComparisons() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/compare/suggested')
      .then((r) => {
        if (!cancelled) setPairs(r.data?.data || []);
      })
      .catch(() => {
        if (!cancelled) setPairs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (!loading && !pairs.length) return null;

  return (
    <Section
      className="bg-gradient-to-b from-blue-50/70"
      eyebrow="Similar cars"
      title={<>Compare <span className="font-black"> similar cars</span></>}
      viewAllHref="/compare"
    >
      {loading ? (
        <CarGridSkeleton />
      ) : (
        <div className="relative px-2">
          <button
            ref={prevRef}
            aria-label="Previous comparisons"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all shadow-md items-center justify-center font-bold text-base cursor-pointer"
          >
            ‹
          </button>
          <button
            ref={nextRef}
            aria-label="Next comparisons"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all shadow-md items-center justify-center font-bold text-base cursor-pointer"
          >
            ›
          </button>
          <Swiper
            modules={[Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            breakpoints={{ 768: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }}
            className="w-full !py-2"
          >
            {pairs.map((pair) => (
              <SwiperSlide key={pair.id} className="h-auto">
                <CompareVsCard pair={pair} to={`/compare?ids=${(pair.ids || []).join(',')}`} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </Section>
  );
}

function budgetListHref(budget) {
  const params = new URLSearchParams();
  Object.entries(budgetQuery(budget)).forEach(([key, value]) => params.set(key, String(value)));
  return `/cars?${params.toString()}`;
}

function BudgetCarsByTabs() {
  const defaultIdx = Math.max(0, BUDGETS.findIndex((b) => b.label === '₹3 – 5 Lakh'));
  const [tab, setTab] = useState(defaultIdx);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const budget = BUDGETS[tab] || BUDGETS[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/cars', { params: { ...budgetQuery(budget), limit: 10, sort: '-createdAt' } })
      .then((res) => {
        if (!cancelled) setCars(res.data?.cars || []);
      })
      .catch(() => {
        if (!cancelled) setCars([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <Section
      className="bg-white"
      eyebrow="Choose a budget"
      title={<>Trusted used cars <span className="font-black"> by budget</span></>}
      viewAllHref={budgetListHref(budget)}
    >
      <div
        className="flex gap-2 overflow-x-auto pb-4 mb-1 -mx-1 px-1"
        role="tablist"
        aria-label="Car budget"
      >
        {BUDGETS.map((b, i) => (
          <button
            key={b.label}
            type="button"
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
              i === tab
                ? 'bg-[#3083ff] text-white border-[#3083ff] shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-[#3083ff]/50'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      {loading ? <CarGridSkeleton /> : <CarSlider cars={cars} />}
    </Section>
  );
}

function CarSlider({ cars }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  if (!cars?.length) return <p className="text-slate-500 font-medium text-sm py-4">No vehicles available right now.</p>;

  const thumb = (car) => {
    const img = car.images?.[0];
    if (!img) return '';
    return String(img).startsWith('http') ? img : mediaUrl(img);
  };

  return (
    <>
      <div className="lg:hidden flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 snap-x">
        {cars.map((car) => (
          <Link key={car._id} to={`/cars/${car._id}`} className="snap-start shrink-0 w-[210px] bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="h-[118px] bg-slate-100">
              {thumb(car) ? <img src={thumb(car)} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <div className="p-3">
              <p className="text-[13px] font-bold text-slate-900 line-clamp-1">{car.title}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">
                {[car.kmDriven != null ? formatKm(car.kmDriven) : null, car.fuel, car.transmission].filter(Boolean).join(' · ')}
              </p>
              <p className="text-[15px] font-black text-[#3083ff] mt-1.5">{formatPrice(car.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    <div className="relative px-2 hidden lg:block">
      <button
        ref={prevRef}
        aria-label="Previous cars"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all shadow-md items-center justify-center font-bold text-base cursor-pointer"
      >
        ‹
      </button>
      <button
        ref={nextRef}
        aria-label="Next cars"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all shadow-md items-center justify-center font-bold text-base cursor-pointer"
      >
        ›
      </button>

      <Swiper
        modules={[Autoplay, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 4 },
        }}
        className="w-full !py-2"
      >
        {cars.map((c) => (
          <SwiperSlide key={c._id} className="h-auto">
            <CarCard car={c} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
    </>
  );
}

export function CategoryBox({ title, badge, icon, items, onSelect }) {
  return (
    <div className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_20px_40px_0_rgba(37,99,235,0.15)] hover:border-blue-500/40 transition-all duration-500 overflow-hidden">
      {/* Radiant Top Hover Beam */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                {icon}
              </div>
            )}
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
              {title}
            </h3>
          </div>

          <span className="bg-slate-900/5 border border-slate-900/10 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            {badge}
          </span>
        </div>

        {/* List Items / Badges */}
        <div className="flex flex-wrap gap-2 mt-5">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className="group/pill relative px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-blue-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <span>{item}</span>
              <span className="text-[10px] opacity-0 -ml-1 group-hover/pill:opacity-100 group-hover/pill:ml-0 transition-all duration-200">
                →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Subtle Gradient Accent Line */}
      <div className="mt-6 pt-4 border-t border-slate-200/40 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
        <span>Quick Filter</span>
        <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
      </div>
    </div>
  );
}