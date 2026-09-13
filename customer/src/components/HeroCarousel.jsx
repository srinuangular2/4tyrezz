import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';
import { mediaUrl } from '../pages/profile/hubUtils';

const FALLBACK_SLIDE = {
  _id: 'fallback',
  image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80',
  titleLine1: 'Find Your',
  titleLine2: 'Dream Car',
  subtitle: 'Quality used cars, verified sellers, and the best deals — all in one place.',
  ctaLabel: 'Search Cars',
  linkType: 'url',
  url: '/cars',
};

const FEATURES = [
  {
    title: 'Verified',
    subtitle: 'Cars',
    icon: (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Trusted',
    subtitle: 'Sellers',
    icon: (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    title: 'Easy',
    subtitle: 'Financing',
    icon: (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Dedicated',
    subtitle: 'Support',
    icon: (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8M3 11a9 9 0 0118 0v3a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h1M3 11a2 2 0 012-2h1a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3z" />
      </svg>
    ),
  },
];

const SLIDE_MS = 8000;

function ArrowButton({ dir, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-30 flex w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 text-slate-900 shadow-lg items-center justify-center hover:bg-white hover:scale-105 transition-all ${
        dir === 'prev' ? 'left-3 sm:left-4 md:left-6' : 'right-3 sm:right-4 md:right-6'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {dir === 'prev' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

export default function HeroCarousel() {
  const navigate = useNavigate();
  const { brands } = useReferenceData();
  const [slides, setSlides] = useState([FALLBACK_SLIDE]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef(null);
  const touchX = useRef(null);

  const [selectedMake, setSelectedMake] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  useEffect(() => {
    api.get('/banners')
      .then((r) => {
        if (r.data?.length) {
          setSlides(r.data.map((b) => ({
            ...b,
            titleLine1: b.titleLine1 || b.title || '',
            titleLine2: b.titleLine2 || '',
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const startTimer = () => {
    clearInterval(timer.current);
    if (slides.length <= 1) return;
    timer.current = setInterval(() => setActive((a) => (a + 1) % slides.length), SLIDE_MS);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timer.current);
  }, [slides]);

  const go = (i) => {
    setActive((i + slides.length) % slides.length);
    startTimer();
  };

  const prev = () => go(active - 1);
  const next = () => go(active + 1);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedMake) params.set('brand', selectedMake);
    if (selectedPrice) params.set('maxPrice', selectedPrice);
    navigate(`/cars?${params.toString()}`);
  };

  const current = slides[active] || FALLBACK_SLIDE;
  const line1 = current.titleLine1 || current.title || 'Find Your';
  const line2 = current.titleLine2 || '';

  if (!loaded) {
    return (
      <div className="w-full h-[520px] md:h-[620px] bg-slate-900 animate-pulse flex items-center">
        <div className="max-w-8xl mx-auto px-6 sm:px-12 w-full space-y-4">
          <div className="h-4 w-28 bg-slate-800 rounded-md" />
          <div className="h-12 w-2/5 bg-slate-800 rounded-lg" />
          <div className="h-6 w-1/3 bg-slate-800 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900 text-white"
      onMouseEnter={() => clearInterval(timer.current)}
      onMouseLeave={startTimer}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null || slides.length <= 1) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) (dx > 0 ? prev() : next());
      }}
    >
      <div className="relative h-[520px] md:h-[600px] lg:h-[690px] w-full flex flex-col justify-between pb-8">
        <div className="absolute inset-0 overflow-hidden">
          {slides.map((slide, i) => (
            <div
              key={slide._id || i}
              className="absolute inset-0 w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{ transform: `translateX(${(i - active) * 100}%)` }}
            >
              <img
                src={mediaUrl(slide.image) || slide.image}
                alt={slide.title || slide.titleLine2 || 'Hero Banner'}
                loading={i === 0 ? 'eager' : 'lazy'}
                className={`w-full h-full object-cover ${i === active ? 'animate-heroKenburns' : ''}`}
              />
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <ArrowButton dir="prev" label="Previous slide" onClick={prev} />
            <ArrowButton dir="next" label="Next slide" onClick={next} />
          </>
        )}

        {/* Main Banner Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 w-full my-auto">
          <div key={active} className="max-w-4xl text-left animate-heroCopyIn space-y-3">
            
            {/* Eyebrow Badges */}
            <div className="flex items-center gap-5 text-[12px] font-bold text-[#0656fe] uppercase tracking-wider">
              <span>USED CARS</span>
              <span>•</span>
              <span>BEST PRICES</span>
              <span>•</span>
              <span>TRUSTED</span>
            </div>

            <h1 className="font-extrabold tracking-tight leading-[1.05] font-display">
              <span className="text-[#0e172a] block text-5xl md:text-6xl lg:text-6xl font-extrabold">
                {line1}
              </span>
              {line2 && (
                <span className="text-[#1853ff] block text-6xl md:text-7xl lg:text-8xl font-black">
                  {line2.startsWith('M') ? (
                    <>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1853ff] via-[#0072ff] to-[#00bfff]">
                        M
                      </span>
                      {line2.slice(1)}
                    </>
                  ) : (
                    line2
                  )}
                </span>
              )}
            </h1>

            {current.subtitle && (
              <h6 className="text-black font-semibold text-[16px] md:text-base max-w-md leading-relaxed pt-1 pb-5">
                {current.subtitle}
              </h6>
            )}

            <form
              onSubmit={handleSearch}
              className="mt-12 bg-white rounded-full shadow-xl p-2 flex flex-col md:flex-row items-center gap-2 text-slate-800 border border-slate-100 max-w-xl"
            >
              <div className="flex items-center gap-2 flex-1 px-4 py-1.5 w-full border-b md:border-b-0 md:border-r border-slate-200">
                <svg className="w-5 h-5 text-slate-800 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="w-full text-left">
                  <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-tight">Make / Model</label>
                  <select
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-500 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Make</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 px-4 py-1.5 w-full">
                <span className="text-slate-800 font-bold text-base">₹</span>
                <div className="w-full text-left">
                  <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-tight">Price Range</label>
                  <select
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-500 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Range</option>
                    <option value="500000">Under 5 Lakhs</option>
                    <option value="1000000">Under 10 Lakhs</option>
                    <option value="2000000">Under 20 Lakhs</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto bg-[#2067f5] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Cars</span>
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 w-full pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
            {FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 ${
                  idx !== FEATURES.length - 1 ? 'md:border-r md:border-slate-100/30' : ''
                }`}
              >
                <div className="p-2.5 flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-white">{feat.title}</p>
                  <p className="text-sm font-semibold text-white">{feat.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === active ? 'w-8 h-2 bg-[#2067f5]' : 'w-2 h-2 bg-white/50 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
