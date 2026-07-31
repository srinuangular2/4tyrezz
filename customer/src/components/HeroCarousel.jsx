import { useEffect, useRef, useState } from 'react';

// Auto-playing promo carousel for the top of the Home page. Ships with three
// gradient "banner" slides (no external image dependency) — drop real car
// photography into /public/hero/ and swap the `image` field per slide to
// upgrade visuals without touching the component.
const SLIDES = [
  {
    eyebrow: 'Used cars, verified tyre to tyre',
    title: 'Buy a used car you don\u2019t have to gamble on.',
    text: 'Every listing passes a 15-point manual inspection before it\u2019s shown to you.',
    cta: 'Browse cars', href: '/cars',
    image: null,
  },
  {
    eyebrow: 'Sell in days, not months',
    title: 'Get verified dealers bidding on your car.',
    text: 'List once and let our dealer network make offers — no haggling required.',
    cta: 'Sell your car', href: '/dashboard/add-car',
    image: null,
  },
  {
    eyebrow: 'Limited time',
    title: 'Zero inspection fee on your first booking.',
    text: 'Book a physical inspection before you buy — on us, this month only.',
    cta: 'Learn more', href: '/faqs',
    image: null,
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer.current);
  }, []);

  const go = (i) => {
    clearInterval(timer.current);
    setActive(i);
    timer.current = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 5000);
  };

  const slide = SLIDES[active];

  return (
    <section className="">
      <div className="relative overflow-hidden bg-red-gradient min-h-[380px] md:min-h-[440px] flex items-center">
        {/* decorative car silhouette / gradient glow, swapped out per-slide when a real photo is supplied */}
        <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="absolute -right-10 bottom-0 w-[55%] h-[85%] opacity-15 hidden md:block">
          <CarSilhouette />
        </div>

        <div key={active} className="relative container-px py-12 md:py-0 md:pl-4 max-w-xl animate-fadeUp">
          <p className="text-white/80 font-display font-bold uppercase tracking-widest text-xs md:text-sm">{slide.eyebrow}</p>
          <h1 className="font-display font-extrabold text-white text-3xl sm:text-4xl lg:text-[46px] leading-[1.08] mt-3">
            {slide.title}
          </h1>
          <p className="text-white/85 mt-4 max-w-md">{slide.text}</p>
          <a href={slide.href} className="inline-block bg-white text-ember font-display font-bold px-7 py-3.5 rounded-xl mt-7 hover:bg-cream transition shadow-lg">
            {slide.cta} →
          </a>
        </div>

        <button onClick={() => go((active - 1 + SLIDES.length) % SLIDES.length)} aria-label="Previous slide"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white items-center justify-center backdrop-blur transition">
          ‹
        </button>
        <button onClick={() => go((active + 1) % SLIDES.length)} aria-label="Next slide"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white items-center justify-center backdrop-blur transition">
          ›
        </button>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-7 bg-white' : 'w-1.5 bg-white/50'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CarSilhouette() {
  return (
    <svg viewBox="0 0 400 220" className="w-full h-full" fill="none">
      <path
        d="M40 150c0-15 12-25 28-28l30-45c8-12 22-19 37-19h100c16 0 31 8 39 21l26 41c17 3 30 14 30 30v20c0 8-6 14-14 14h-16a30 30 0 0 1-60 0H140a30 30 0 0 1-60 0H54c-8 0-14-6-14-14v-20Z"
        fill="white"
      />
      <circle cx="110" cy="164" r="26" fill="#B4101F" />
      <circle cx="290" cy="164" r="26" fill="#B4101F" />
    </svg>
  );
}
