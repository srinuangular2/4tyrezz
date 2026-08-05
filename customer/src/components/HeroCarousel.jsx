import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const FALLBACK_SLIDE = {
  _id: 'fallback',
  image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80',
  title: 'Find your dream car, inspected end to end.',
  subtitle: 'Every listing passes a 15-point manual inspection before it’s shown to you.',
  ctaLabel: 'Browse cars',
  linkType: 'url',
  url: '/cars',
};

export default function HeroCarousel() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([FALLBACK_SLIDE]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    api.get('/banners')
      .then((r) => { if (r.data?.length) setSlides(r.data); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    timer.current = setInterval(() => setActive((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(timer.current);
  }, [slides]);

  const go = (i) => {
    clearInterval(timer.current);
    setActive(i);
    if (slides.length > 1) {
      timer.current = setInterval(() => setActive((a) => (a + 1) % slides.length), 5000);
    }
  };

  const handleClick = (slide) => {
    if (slide.linkType === 'car' && slide.car) {
      navigate(`/cars/${slide.car._id || slide.car}`);
    } else if (slide.linkType === 'url' && slide.url) {
      if (slide.url.startsWith('http')) window.open(slide.url, '_blank');
      else navigate(slide.url);
    }
  };

  const current = slides[active] || FALLBACK_SLIDE;
  const clickable = current.linkType === 'car' || current.linkType === 'url';

  if (!loaded) {
    return (
      <div className="w-full h-[460px] md:h-[520px] bg-slate-900 animate-pulse flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full space-y-4">
          <div className="h-4 w-28 bg-slate-800 rounded-md" />
          <div className="h-10 w-2/5 bg-slate-800 rounded-lg" />
          <div className="h-6 w-1/3 bg-slate-800 rounded-md" />
          <div className="h-11 w-36 bg-slate-800 rounded-xl pt-2" />
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-slate-950">
      <div className="relative h-[460px] md:h-[520px] lg:h-[560px] w-full flex items-center">
        
        {/* Background Images */}
        {slides.map((slide, i) => (
          <img
            key={slide._id}
            src={slide.image}
            alt={slide.title || 'Hero Banner'}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              i === active ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          />
        ))}

        {/* Left Directional Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 sm:via-slate-950/60 to-transparent z-10" />

        {/* Left-Aligned Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full flex items-center justify-start">
          <div
            key={active}
            className="max-w-xl text-left animate-fadeIn space-y-4"
          >
            {/* Eyebrow Badge in #ff0000 */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border"
              style={{ 
                backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                borderColor: 'rgba(255, 0, 0, 0.3)' 
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ff0000' }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#ff0000' }}>
                Verified Inventory
              </span>
            </div>

            {/* Slide Title */}
            {current.title && (
              <h1 className="font-extrabold text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.15] drop-shadow-sm">
                {current.title}
              </h1>
            )}

            {/* Slide Subtitle */}
            {current.subtitle && (
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg font-normal">
                {current.subtitle}
              </p>
            )}

            {/* CTA Button in #ff0000 */}
            {clickable && (
              <div className="pt-2">
                <button
                  onClick={() => handleClick(current)}
                  style={{ backgroundColor: '#ff0000' }}
                  className="group inline-flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-lg hover:brightness-110 active:brightness-90 cursor-pointer"
                >
                  <span>{current.ctaLabel || 'Learn More'}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Slider Controls */}
        {slides.length > 1 && (
          <>
            {/* Left/Right Arrow Buttons */}
            <button
              onClick={() => go((active - 1 + slides.length) % slides.length)}
              aria-label="Previous slide"
              className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white border border-white/10 backdrop-blur-md items-center justify-center transition-all cursor-pointer hover:scale-105"
            >
              ‹
            </button>
            <button
              onClick={() => go((active + 1) % slides.length)}
              aria-label="Next slide"
              className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white border border-white/10 backdrop-blur-md items-center justify-center transition-all cursor-pointer hover:scale-105"
            >
              ›
            </button>

            {/* Pill Dash Indicators */}
            <div className="absolute bottom-6 left-6 sm:left-12 lg:left-16 z-30 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  style={{ backgroundColor: i === active ? '#ff0000' : undefined }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === active ? 'w-8' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}