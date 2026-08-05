import { useRef } from 'react';

// Horizontal scrolling row used for Similar/Recommended/Similar-Models strips
// on the car detail page — mirrors the carousel pattern from the CarDekho
// reference without pulling in a slider library.
export default function ScrollStrip({ title, children }) {
  const trackRef = useRef(null);
  const scrollBy = (dir) => trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-2xl">{title}</h3>
        <div className="hidden sm:flex gap-2">
          <button onClick={() => scrollBy(-1)} aria-label="Scroll left" className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center">‹</button>
          <button onClick={() => scrollBy(1)} aria-label="Scroll right" className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center">›</button>
        </div>
      </div>
      <div ref={trackRef} className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
