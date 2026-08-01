import { useEffect, useState } from 'react';
import { Close } from './icons';

// Fullscreen gallery viewer with keyboard navigation and click-to-zoom.
// Only ever receives `images` for the single car that opened it — the
// CarDetails page is responsible for scoping that array to the current car.
export default function ImageLightbox({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);

  const next = () => { setZoomed(false); setIndex((i) => (i + 1) % images.length); };
  const prev = () => { setZoomed(false); setIndex((i) => (i - 1 + images.length) % images.length); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-fadeUp" onClick={onClose}>
      <div className="flex justify-between items-center px-5 py-4 text-white">
        <span className="text-sm font-semibold">{index + 1} / {images.length}</span>
        <button onClick={onClose} aria-label="Close gallery" className="hover:text-ember transition"><Close className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-4" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button onClick={prev} aria-label="Previous image"
            className="absolute left-2 md:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl">
            ‹
          </button>
        )}
        <img
          src={images[index]}
          alt=""
          onClick={() => setZoomed((z) => !z)}
          className={`max-h-[75vh] rounded-lg cursor-zoom-in transition-transform duration-300 ${zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'}`}
        />
        {images.length > 1 && (
          <button onClick={next} aria-label="Next image"
            className="absolute right-2 md:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl">
            ›
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 justify-center py-5 px-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <img
              key={i} src={img} onClick={() => { setZoomed(false); setIndex(i); }}
              className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 ${i === index ? 'border-ember' : 'border-transparent opacity-50 hover:opacity-80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
