import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import CarCard from '../components/CarCard';
import { CarGridSkeleton } from '../components/Skeletons';
import HeroCarousel from '../components/HeroCarousel';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';

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

const TESTIMONIALS = [
  { name: 'Ananya R.', role: 'Verified Buyer', text: 'The 15-point inspection gave me real confidence. Found a Nexon with zero hidden issues!', rating: 5 },
  { name: 'Vikram S.', role: 'Verified Seller', text: 'Sold my Swift in 4 days through the dealer network. Very smooth process.', rating: 5 },
  { name: 'Priya M.', role: 'Verified Buyer', text: 'The inspection score right on the listing saved me so much time driving around.', rating: 5 },
  { name: 'Kiran K.', role: 'Verified Buyer', text: 'Great platform! Transparent deal and zero hidden costs.', rating: 5 },
];

const FAQS = [
  { q: 'How does the 15-point inspection work?', a: 'Every used car undergoes a thorough inspection covering engine health, tyre wear, electricals, chassis integrity, and odometer verification before listing.' },
  { q: 'Can I sell my car directly to a buyer?', a: 'Yes! You can list directly to buyers (C2C) or post once and receive competitive offers from verified local dealers (C2B).' },
  { q: 'Are all listed used cars verified?', a: 'Yes, every listing includes a transparent inspection score and verified seller badge.' },
];

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

  const displayedBrands = brands.slice(0, 10);

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
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-100">
            {[
              ['1,200+', 'Used Cars Inspected'],
              ['40+', 'Verified Dealers'],
              ['100%', 'Inspected Listings'],
              ['91%', 'Avg. Inspection Score']
            ].map(([num, label], idx) => (
              <div key={label} className={idx === 0 ? '' : 'pl-4'}>
                <div className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">{num}</div>
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FEATURED CARS SLIDER ---- */}
      <Section eyebrow="Featured Inventory" title="Popular Pre-Owned Cars" viewAllHref="/cars?isFeatured=true">
        {loading ? <CarGridSkeleton /> : <CarSlider cars={featured} />}
      </Section>

      {/* ---- POPULAR BRANDS ---- */}
      <Section eyebrow="Explore By Make" title="Popular Brands" bg>
        <div className="relative px-2">
          <button
            ref={brandPrevRef}
            aria-label="Previous brands"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
          >
            ‹
          </button>
          <button
            ref={brandNextRef}
            aria-label="Next brands"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
          >
            ›
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={16}
            slidesPerView={2}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = brandPrevRef.current;
              swiper.params.navigation.nextEl = brandNextRef.current;
            }}
            navigation={{ prevEl: brandPrevRef.current, nextEl: brandNextRef.current }}
            breakpoints={{
              480: { slidesPerView: 3 },
              640: { slidesPerView: 4 },
              768: { slidesPerView: 5 },
              1024: { slidesPerView: 6 },
            }}
            className="w-full !py-2"
          >
            {displayedBrands.map((b) => (
              <SwiperSlide key={b._id}>
                <Link
                  to={`/cars?brand=${b._id}`}
                  className="bg-white border border-slate-200 hover:border-[#fe0100] rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 card-item h-28 [&:hover_span]:text-[#fe0100] [&:hover_img]:scale-105"
                >
                  {b.logo ? (
                    <img
                      src={b.logo.startsWith('http') ? b.logo : `http://localhost:5000${b.logo}`}
                      alt={b.name}
                      className="h-9 w-auto object-contain transition-transform duration-200"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                      {b.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-extrabold text-xs text-slate-900 transition-colors duration-200 line-clamp-1">
                    {b.name}
                  </span>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Section>

      {/* ---- LATEST CARS ---- */}
      <Section eyebrow="Fresh Listings" title="Latest Used Cars" viewAllHref="/cars?sort=-createdAt">
        {loading ? <CarGridSkeleton /> : <CarSlider cars={latest} />}
      </Section>

      {/* ---- PREMIUM VEHICLES ---- */}
      <Section eyebrow="Exclusive Inventory" title="Premium Pre-Owned Vehicles" bg viewAllHref="/cars?isPremium=true">
        {loading ? <CarGridSkeleton /> : <CarSlider cars={premium} />}
      </Section>

      {/* ---- BROWSE BY CATEGORY ---- */}
      <Section eyebrow="Find Your Style" title="Browse By Category">
        <div className="grid md:grid-cols-3 gap-6">
          <CategoryBox
            title="Browse by Budget"
            badge="Price"
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
            title="Browse by Fuel"
            badge="Engine"
            items={FUEL_TYPES}
            onSelect={(i) => navigate(`/cars?fuel=${FUEL_TYPES[i]}`)}
          />
          <CategoryBox
            title="Browse by Body Style"
            badge="Design"
            items={BODY_TYPES.map((b) => b.name)}
            onSelect={(i) => navigate(`/cars?bodyType=${BODY_TYPES[i].name}`)}
          />
        </div>
      </Section>

      {/* ---- 4-STEP VERIFICATION PROCESS ---- */}
      <Section eyebrow="Quality First" title="4-Step Verification Process" bg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            ['01', 'Slot Booking', 'Book an appointment at your convenience online or over the phone.'],
            ['02', '15-Point Inspection', 'Engine, chassis, tyres, electronics & paper verification.'],
            ['03', 'Automated Scoring', 'An algorithmic inspection score generated instantly.'],
            ['04', 'Digital Certificate', 'Download transparent report before taking a test drive.']
          ].map(([step, header, desc]) => (
            <div
              key={step}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-[#fe0100]/30 transition-all relative overflow-hidden flex flex-col justify-between [&:hover_.step-num]:bg-[#fe0100]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="step-num w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm transition-colors">
                  {step}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{header}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- FEATURED DEALERS SLIDER ---- */}
      <Section eyebrow="Verified Partners" title="Featured Commercial Dealer Network">
        <div className="relative px-2">
          <button
            ref={dealerPrevRef}
            aria-label="Previous dealers"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
          >
            ‹
          </button>
          <button
            ref={dealerNextRef}
            aria-label="Next dealers"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
          >
            ›
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
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
            className="w-full !py-2"
          >
            {FEATURED_DEALERS.map((dealer) => (
              <SwiperSlide key={dealer.name} className="h-auto">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-[#fe0100]/50 transition-all flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        {dealer.badge}
                      </span>
                      <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                        {dealer.rating}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug">{dealer.name}</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{dealer.city}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">{dealer.inventory}</span>
                    <Link to="/cars" className="font-black text-[#fe0100] hover:underline cursor-pointer">
                      View Showroom →
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Section>

      {/* ---- TESTIMONIALS ---- */}
      <Section eyebrow="Reviews" title="What Buyers & Sellers Say" bg>
        <div className="relative px-2">
          <button
            ref={testPrevRef}
            aria-label="Previous testimonials"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
          >
            ‹
          </button>
          <button
            ref={testNextRef}
            aria-label="Next testimonials"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-[#fe0100] hover:text-white hover:border-[#fe0100] transition-all shadow-md flex items-center justify-center font-bold text-base cursor-pointer"
          >
            ›
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = testPrevRef.current;
              swiper.params.navigation.nextEl = testNextRef.current;
            }}
            navigation={{ prevEl: testPrevRef.current, nextEl: testNextRef.current }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="w-full !py-2"
          >
            {TESTIMONIALS.map((t) => (
              <SwiperSlide key={t.name} className="h-auto">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-0.5 text-amber-500 text-xs">
                        {'★'.repeat(t.rating)}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {t.role}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">&ldquo;{t.text}&rdquo;</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block leading-tight">{t.name}</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Section>

      {/* ---- FAQS ---- */}
      <Section eyebrow="Help Center" title="Frequently Asked Questions">
        <div className="max-w-3xl space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="bg-white border border-slate-200 rounded-xl p-5 group cursor-pointer shadow-xs [&_summary::-webkit-details-marker]:none">
              <summary className="font-extrabold text-slate-900 flex justify-between items-center text-sm sm:text-base">
                <span>{f.q}</span>
                <span className="w-7 h-7 rounded-full bg-slate-100 group-open:bg-[#fe0100] group-open:text-white flex items-center justify-center text-slate-700 font-bold text-sm transition-colors">
                  +
                </span>
              </summary>
              <p className="text-xs sm:text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed font-medium">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ---- MOBILE APP DOWNLOAD SECTION ---- */}
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 border border-slate-800">
          <div className="max-w-xl relative z-10 text-center md:text-left">
            <span style={{ color: '#fe0100' }} className="text-xs font-extrabold uppercase tracking-wider bg-red-950/80 px-3 py-1 rounded-md border border-red-800/50">
              Experience On The Go
            </span>
            <h2 className="font-black text-white text-2xl sm:text-4xl mt-3 tracking-tight">
              Download Our Mobile App
            </h2>
            <p className="text-slate-300 mt-3 text-xs sm:text-sm leading-relaxed font-medium">
              Browse verified listings, schedule inspections, and list your car directly from your phone. Available on iOS and Android.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-auto justify-center">
            {/* Apple App Store */}
            <a
              href="#"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl px-5 py-3 flex items-center gap-3 transition-all shadow-md hover:scale-[1.02]"
            >
              <svg className="w-7 h-7 fill-current transition-transform" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.75 1.04-1.8 0.92-2.84-.9.04-2 .6-2.63 1.34-.56.65-1.06 1.71-.92 2.73 1.01.08 2.02-.48 2.63-1.23z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] uppercase font-medium text-slate-400">Download on the</div>
                <div className="text-sm font-extrabold text-white tracking-wide">App Store</div>
              </div>
            </a>

            {/* Google Play Store */}
            <a
              href="#"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl px-5 py-3 flex items-center gap-3 transition-all shadow-md hover:scale-[1.02]"
            >
              <svg className="w-7 h-7 fill-current transition-transform" viewBox="0 0 24 24">
                <path d="M3 20.5v-17c0-.55.33-.82.8-.52l12.4 8.5c.4.28.4.74 0 1.02L3.8 21.02c-.47.3-.8.03-.8-.52zM17.8 11.2 5.5 2.8l10.5 10.5c.35-.35.35-.91 0-1.26zm0 1.6L16 14.3l-10.5 10.5 12.3-8.4c.35-.35.35-.91 0-1.26z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] uppercase font-medium text-slate-400">Get it on</div>
                <div className="text-sm font-extrabold text-white tracking-wide">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>
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

function Section({ eyebrow, title, children, bg, viewAllHref }) {
  return (
    <section className={bg ? 'bg-white py-16 border-y border-slate-200' : 'py-16'}>
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p style={{ color: '#fe0100' }} className="font-black uppercase tracking-wider text-xs">{eyebrow}</p>
            <h2 className="font-black text-slate-900 text-2xl sm:text-3xl mt-1 tracking-tight">{title}</h2>
          </div>
          {viewAllHref && (
            <Link to={viewAllHref} style={{ color: '#fe0100' }} className="hover:brightness-90 font-extrabold text-sm flex items-center gap-1 group">
              <span>View All</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function CategoryBox({ title, badge, items, onSelect }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-black text-slate-900 text-base">{title}</h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {badge}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {items.map((item, idx) => (
            <button
              key={item}
              onClick={() => onSelect(idx)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-[#fe0100] transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-200/60"
            >
              <span>{item}</span>
              <span className="text-slate-300 group-hover:text-[#fe0100] group-hover:translate-x-0.5 transition-all font-bold">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}