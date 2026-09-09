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
import 'swiper/css';
import 'swiper/css/navigation';

const BUDGETS = [
  { label: 'Under ₹3 Lakh', max: 300000 },
  { label: '₹3 – ₹5 Lakh', min: 300000, max: 500000 },
  { label: '₹5 – ₹10 Lakh', min: 500000, max: 1000000 },
  { label: '₹10 – ₹20 Lakh', min: 1000000, max: 2000000 },
  { label: 'Above ₹20 Lakh', min: 2000000 },
];

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];

const BODY_TYPES = [
  { name: 'Hatchback', icon: '🚗' },
  { name: 'Sedan', icon: '🚘' },
  { name: 'SUV', icon: '🚙' },
  { name: 'MUV', icon: '🚐' }
];

const FEATURED_DEALERS = [
  { name: "Metro Auto Hub", city: "Hyderabad", inventory: "42 Vehicles", rating: "4.9 ★", badge: "Premium Partner" },
  { name: "Apex Pre-Owned Cars", city: "Bangalore", inventory: "38 Vehicles", rating: "4.8 ★", badge: "Verified Dealer" },
  { name: "Royal Motor World", city: "Mumbai", inventory: "55 Vehicles", rating: "4.9 ★", badge: "Platinum Partner" },
  { name: "Deccan Wheels & Co.", city: "Secunderabad", inventory: "29 Vehicles", rating: "4.7 ★", badge: "Verified Dealer" },
  { name: "Speedway Automobiles", city: "Chennai", inventory: "34 Vehicles", rating: "4.8 ★", badge: "Verified Dealer" },
  { name: "Elite Car Studio", city: "Pune", inventory: "23 Vehicles", rating: "4.9 ★", badge: "Premium Partner" },
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
    <section className={`${bg ? 'bg-white' : ''} py-12  ${className}`}>
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
        {(eyebrow || title || viewAllHref) && (
          <div className="flex items-end justify-between pb-3 mb-5 border-b border-slate-100">
            <div>
              {eyebrow && (
                <p className="text-[14px] font-medium text-[#909294] uppercase tracking-[5px] font-display mb-3">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display">
                  {renderFormattedTitle(title)}
                </h2>
              )}
            </div>
            {viewAllHref && (
              <Link
                to={viewAllHref}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-black hover:text-[#3083ff] transition-all group font-display uppercase tracking-wider mb-1"
              >
                <span>View All</span>
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
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
  const [featured, setFeatured] = useState([]);
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
  const dealerPrevRef = useRef(null);
  const dealerNextRef = useRef(null);
  const testPrevRef = useRef(null);
  const testNextRef = useRef(null);
  const displayedBrands = brands.slice(0, 12);

  useEffect(() => {
    Promise.all([
      api.get('/cars', { params: { isFeatured: true, limit: 10 } }),
      api.get('/cars', { params: { sort: '-createdAt', limit: 10 } }),
      api.get('/cars', { params: { isPremium: true, limit: 10 } }),
    ]).then(([f, l, p]) => {
      setFeatured(f.data.cars);
      setLatest(l.data.cars);
      setPremium(p.data.cars);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (filterMode === 'budget' && selectedBudget !== '') {
      const b = BUDGETS[selectedBudget];
      if (b.min) params.set('minPrice', b.min);
      if (b.max) params.set('maxPrice', b.max);
    } else if (filterMode === 'brand' && selectedBrand) {
      params.set('brand', selectedBrand);
    }
    if (selectedBody) params.set('bodyType', selectedBody);
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased selection:bg-[#fe0100] selection:text-white">
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
                    className="accent-[#fe0100] w-4 h-4 cursor-pointer"
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
                    className="accent-[#fe0100] w-4 h-4 cursor-pointer"
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
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-none focus:border-[#fe0100] focus:ring-1 focus:ring-[#fe0100] shadow-xs cursor-pointer"
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
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-none focus:border-[#fe0100] focus:ring-1 focus:ring-[#fe0100] shadow-xs cursor-pointer"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-none focus:border-[#fe0100] focus:ring-1 focus:ring-[#fe0100] shadow-xs cursor-pointer"
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
                  style={{ backgroundColor: '#fe0100' }}
                  className="w-full hover:brightness-90 text-white font-black rounded-xl py-3.5 transition-all text-sm cursor-pointer shadow-lg uppercase tracking-wide mt-2"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>



      {/* ---- KEY METRICS ---- */}
      <section className="py-16 bg-white">
        <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
          <QuickServices />
        </div>
      </section>

      {/* ---- FEATURED CARS SLIDER ---- */} 
        <Section className='bg-gradient-to-b from-blue-50/70' eyebrow="FEATURED" title={<>FEATURED <span className="font-black">CARS</span></>} viewAllHref="/cars?isFeatured=true">
          {loading ? <CarGridSkeleton /> : <CarSlider cars={featured} />}
        </Section>

{/* ---- LATEST CARS ---- */}
     <Section className='bg-white' eyebrow="Fresh Listings" title={<>Latest <span className="font-black"> Used Cars</span></>}  viewAllHref="/cars?sort=-createdAt">
        {loading ? <CarGridSkeleton /> : <CarSlider cars={latest} />}
      </Section>

      {/* ---- POPULAR BRANDS ---- */}
      <CarBannerSection/>

      
<Section eyebrow="all brands" title="Popular Brands" bg>
  <div className="flex flex-col gap-8">
    {/* Top 12 Brands Glassmorphism Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                src={b.logo.startsWith('http') ? b.logo : `http://localhost:5000${b.logo}`}
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
    <div className="flex justify-center mt-2">
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


      {/* ---- PREMIUM VEHICLES ---- */}
      {/* <Section eyebrow="Exclusive Inventory" title="Premium Pre-Owned Vehicles" bg viewAllHref="/cars?isPremium=true">
        {loading ? <CarGridSkeleton /> : <CarSlider cars={premium} />}
      </Section> */}

      {/* ---- BROWSE BY CATEGORY ---- */}
      <Section eyebrow="Find Your Style" title="Browse By Category" className='bg-gradient-to-b from-blue-50/70'>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CategoryBox
            title="By Budget"
            badge="Price"
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            items={BUDGETS.map((b) => b.label)}
            onSelect={(i) => {
              const b = BUDGETS[i];
              const p = new URLSearchParams();
              if (b.min) p.set('minPrice', b.min);
              if (b.max) p.set('maxPrice', b.max);
              navigate(`/cars?${p}`);
            }}
          />
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
        </div>
      </Section>



        <div className='container-px mx-auto px-4 sm:px-6 lg:px-8'>
          <SellCarCTA/>
        </div>



      {/* ---- FEATURED DEALERS SLIDER ---- */}
      <Section eyebrow="Verified Partners"  title={<>our verified<span className="font-black">  Dealers</span></>} >
  <div className="relative px-2">
    {/* Swiper Navigation Buttons */}
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
      {FEATURED_DEALERS.map((dealer) => (
        <SwiperSlide key={dealer.name} className="h-auto">
          <div className="group relative flex flex-col justify-between h-full p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-[0_20px_40px_0_rgba(48,131,255,0.18)] hover:border-[#3083ff]/50 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden">
            
            {/* Top Glowing Beam Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-[#3083ff] to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div>
              {/* Header Badges & Rating */}
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

              {/* Dealer Profile Information */}
              <div className="flex items-center gap-4 my-2">
                {/* Dealer Avatar / Logo Container */}
                <div className="relative w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 p-1 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {dealer.logo || dealer.image ? (
                    <img
                      src={
                        (dealer.logo || dealer.image).startsWith('http')
                          ? dealer.logo || dealer.image
                          : `http://localhost:5000${dealer.logo || dealer.image}`
                      }
                      alt={dealer.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#3083ff] to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-inner">
                      {dealer.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Verified Icon Badge */}
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

            {/* Bottom Footer Action Strip */}
            <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">In Stock</span>
                <span className="font-extrabold text-sm text-slate-900">
                  {dealer.inventory || '25+ Vehicles'}
                </span>
              </div>

              <Link
                to={`/cars?dealer=${dealer._id || dealer.name}`}
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
     </Section>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
      <Section eyebrow="Financing" title={<>Easy Vehicle <span className="font-black">  Loans</span></>} >
        <FinanceCTA />
      </Section> 
    </div>

      {/* ---- TESTIMONIALS ---- */}
      <Section bg>
      <TestimonialCard />
      </Section>

      {/* ---- FAQS ---- */}
      <Section className='bg-gradient-to-b from-blue-50/70'>
        <FaqsSection/>
      </Section>




      {/* ---- 4-STEP VERIFICATION PROCESS ---- */}
      <Section className='bg-white'>
        <HowItWorks/>
      </Section>


      <WhatsAppFloat/>
     
    </div>
  );
}

function CarSlider({ cars }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  if (!cars?.length) return <p className="text-slate-500 font-medium text-sm py-4">No vehicles available right now.</p>;
  
  return (
    <div className="relative px-2">
      <button
        ref={prevRef}
        aria-label="Previous cars"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
      >
        ‹
      </button>
      <button
        ref={nextRef}
        aria-label="Next cars"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
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