import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import { inputClass } from '../PageShell';

export default function SearchableSelect({
  value,
  options = [],
  placeholder = 'Select',
  searchPlaceholder = 'Search',
  disabled = false,
  onChange,
  triggerClassName,
  menuClassName,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const items = useMemo(
    () =>
      options.map((opt, i) => {
        if (typeof opt === 'object' && opt !== null) {
          return {
            value: String(opt.value ?? ''),
            label: String(opt.label ?? opt.value ?? ''),
            badge: opt.badge || '',
            raw: opt,
            key: String(opt.value ?? opt.label ?? i),
          };
        }
        return { value: String(opt), label: String(opt), badge: '', raw: opt, key: `${opt}-${i}` };
      }),
    [options]
  );

  const selected = items.find((o) => o.value === String(value ?? '')) || null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (o) => o.label.toLowerCase().includes(q) || String(o.badge).toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      setMenuPos(null);
      return undefined;
    }
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.max(r.width, 240);
      const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
      setMenuPos({ top: r.bottom + 6, left, width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const pick = (item) => {
    onChange?.(item.value, item.raw);
    setOpen(false);
    setQuery('');
  };

  const menu =
    open && !disabled && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: 400,
            }}
            className={`rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden ${menuClassName || ''}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-slate-100">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:font-medium placeholder:text-slate-400 outline-none"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') setOpen(false);
                  if (e.key === 'Enter' && filtered[0]) {
                    e.preventDefault();
                    pick(filtered[0]);
                  }
                }}
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(item)}
                    className={`w-full text-left px-3.5 py-2.5 text-sm font-bold hover:bg-[#EAF2FF] hover:text-[#1853ff] inline-flex items-center gap-2 ${
                      item.value === String(value ?? '') ? 'bg-[#EAF2FF] text-[#1853ff]' : 'text-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
              {!filtered.length && (
                <li className="px-3.5 py-6 text-sm font-medium text-slate-400 text-center">No matches</li>
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`${triggerClassName || `${inputClass} ${selected ? '' : 'text-slate-400 font-medium'}`} flex items-center justify-between gap-2 text-left disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className="truncate inline-flex items-center gap-2 min-w-0">
          <span className="truncate">{selected?.label || placeholder}</span>
          {selected?.badge ? (
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {selected.badge}
            </span>
          ) : null}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </div>
  );
}
