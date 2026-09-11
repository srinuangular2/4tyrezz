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
    <div className="fixed bottom-16 lg:bottom-4 inset-x-0 z-[70] px-3 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto bg-white/80 backdrop-blur-md border border-white/20 shadow-[0_12px_40px_rgba(15,23,42,0.16)] rounded-2xl px-4 py-3 flex items-center gap-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 shrink-0">Compare</p>
        <div className="flex gap-2 overflow-x-auto flex-1">
          {items.map((row) => (
            <div key={row.id} className="flex items-center gap-2 bg-white/80 border border-white/40 rounded-xl px-2 py-1 shrink-0">
              {row.thumb ? (
                <img src={mediaUrl(row.thumb)} alt="" className="w-10 h-8 object-cover rounded-md" />
              ) : (
                <span className="w-10 h-8 rounded-md bg-slate-100" />
              )}
              <span className="text-[11px] font-bold text-slate-800 max-w-[120px] truncate">{row.title}</span>
              <button type="button" className="text-slate-400 text-xs font-black" onClick={() => removeCompare(row.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <Link
          to={`/compare?ids=${items.map((r) => r.id).join(',')}`}
          className="bg-[#3083ff] text-white text-xs font-black px-3 py-2 rounded-xl shrink-0"
        >
          Compare {items.length}
        </Link>
        <button type="button" className="text-[11px] font-bold text-slate-500 shrink-0" onClick={clearCompare}>
          Clear
        </button>
      </div>
    </div>
  );
}
