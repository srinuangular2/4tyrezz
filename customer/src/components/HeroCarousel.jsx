import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// Fallback slide shown only if the admin hasn't configured any banners yet,
// so the homepage never renders an empty hero.
const FALLBACK_SLIDE = {
  _id: 'fallback',
  image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80',
  title: 'Find your dream car, inspected end to end.',
  subtitle: 'Every listing passes a 15-point manual inspection before it\u2019s shown to you.',
  ctaLabel: 'Browse cars', linkType: 'url', url: '/cars',
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
    return <section className="container-px pt-6"><div className="rounded-3xl skeleton min-h-[420px] md:min-h-[480px]" /></section>;
  }

  return (
    <section className="">
      <div className="relative overflow-hidden min-h-[420px] md:min-h-[480px] flex items-center">
        {slides.map((slide, i) => (
          <img
            key={slide._id}
            src={slide.image}
            alt={slide.title || ''}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === active ? 'opacity-100 animate-kenburns' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/50 to-transparent" />

        <div
          key={active}
          onClick={() => clickable && handleClick(current)}
          className={`relative container-px py-12 md:py-0 max-w-xl animate-fadeUp ${clickable ? 'cursor-pointer' : ''}`}
        >
          {current.title && (
            <h1 className="font-display font-semibold text-white text-3xl sm:text-4xl lg:text-[44px] leading-[1.12]">
              {current.title}
            </h1>
          )}
          {current.subtitle && <p className="text-white/85 mt-4 max-w-md">{current.subtitle}</p>}
          {clickable && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClick(current); }}
              className="inline-block bg-ember hover:bg-ember-dark text-white font-display font-semibold px-7 py-3.5 rounded-xl mt-7 transition shadow-lg"
            >
              {current.ctaLabel || 'Learn more'} →
            </button>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button onClick={() => go((active - 1 + slides.length) % slides.length)} aria-label="Previous slide"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white items-center justify-center backdrop-blur transition">
              ‹
            </button>
            <button onClick={() => go((active + 1) % slides.length)} aria-label="Next slide"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white items-center justify-center backdrop-blur transition">
              ›
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === active ? 'w-7 bg-ember' : 'w-1.5 bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
