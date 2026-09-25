import { useRef } from 'react';

// Horizontal scrolling row used for Similar/Recommended/Similar-Models strips
// on the car detail page — mirrors the carousel pattern from the CarDekho
// reference without pulling in a slider library.
export default function ScrollStrip({ title, children }) {
  const trackRef = useRef(null);
  const scrollBy = (dir) => trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <section className="mt-8 lg:mt-14 max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 lg:mb-4 gap-3">
        <h3 className="text-[15px] lg:font-display lg:font-semibold lg:text-2xl font-black text-slate-900 min-w-0">{title}</h3>
        <div className="hidden sm:flex gap-2 shrink-0">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll left" className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center">‹</button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll right" className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center">›</button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="flex gap-3 lg:gap-5 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar max-w-full"
      >
        {children}
      </div>
    </section>
  );
}
