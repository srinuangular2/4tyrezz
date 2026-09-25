import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearCompare, readCompare, removeCompare } from '../lib/compareTray';
import { mediaUrl } from '../pages/profile/hubUtils';

export default function CompareTray() {
  const [items, setItems] = useState(readCompare);

  useEffect(() => {
    const onChange = () => setItems(readCompare());
    window.addEventListener('4tyrezz-compare', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('4tyrezz-compare', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed bottom-[calc(62px+env(safe-area-inset-bottom))] lg:bottom-4 inset-x-0 z-[70] px-2 sm:px-3 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 shadow-[0_12px_40px_rgba(15,23,42,0.16)] rounded-2xl px-2.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 overflow-hidden">
        <p className="hidden sm:block text-[11px] font-black uppercase tracking-wide text-slate-500 shrink-0">Compare</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {items.map((row) => (
            <div key={row.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 shrink-0">
              {row.thumb ? (
                <img src={mediaUrl(row.thumb)} alt="" className="w-9 h-7 sm:w-10 sm:h-8 object-cover rounded-md" />
              ) : (
                <span className="w-9 h-7 sm:w-10 sm:h-8 rounded-md bg-slate-100" />
              )}
              <span className="text-[11px] font-bold text-slate-800 max-w-[88px] sm:max-w-[120px] truncate">{row.title}</span>
              <button type="button" className="text-slate-400 text-xs font-black" onClick={() => removeCompare(row.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <Link
          to={`/compare?ids=${items.map((r) => r.id).join(',')}`}
          className="bg-[#3083ff] text-white text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-2 rounded-xl shrink-0"
        >
          Go ({items.length})
        </Link>
        <button type="button" className="text-[11px] font-bold text-slate-500 shrink-0 hidden sm:inline" onClick={clearCompare}>
          Clear
        </button>
      </div>
    </div>
  );
}
