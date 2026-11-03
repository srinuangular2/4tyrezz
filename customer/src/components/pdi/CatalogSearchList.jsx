import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { mediaUrl } from '../../pages/profile/hubUtils';

const ROW = 40;
const VISIBLE = 10;

function BrandIcon({ name, logo }) {
  const [failed, setFailed] = useState(false);
  const src = logo && !failed ? mediaUrl(logo) : '';
  if (src) {
    return <img src={src} alt="" className="w-7 h-7 object-contain" onError={() => setFailed(true)} />;
  }
  return (
    <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#3083ff] text-[10px] font-black inline-flex items-center justify-center">
      {String(name || '?').slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function CatalogSearchList({
  label,
  placeholder,
  items,
  value,
  onChange,
  loading,
  disabled,
  emptyText,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const selected = items.find((item) => item.name === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const node = listRef.current?.querySelector('[data-selected="true"]');
    node?.scrollIntoView({ block: 'nearest' });
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const pick = (name) => {
    onChange(name);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : ''} ${disabled ? 'opacity-60' : ''}`}>
      <span className="text-xs font-black text-slate-700">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white disabled:bg-slate-50 flex items-center gap-2.5 text-left"
      >
        {selected ? <BrandIcon name={selected.brandName || selected.name} logo={selected.logo} /> : <Search className="w-4 h-4 text-slate-400" />}
        <span className={`flex-1 truncate ${selected ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
          {selected?.name || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <label className="relative block border-b border-slate-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2.5 text-sm outline-none"
            />
          </label>
          <div ref={listRef} role="listbox" aria-label={label} className="overflow-y-auto" style={{ maxHeight: ROW * VISIBLE }}>
            {loading && <p className="h-10 px-3 flex items-center text-sm text-slate-400">Loading…</p>}
            {!loading && filtered.map((item) => {
              const active = item.name === value;
              return (
                <button
                  key={item.name}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-selected={active ? 'true' : 'false'}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(item.name)}
                  className={`h-10 w-full px-3 flex items-center gap-2.5 text-left text-sm ${active ? 'bg-blue-50 text-[#1853ff] font-black' : 'text-slate-800 hover:bg-slate-50 font-semibold'}`}
                >
                  <BrandIcon name={item.logo ? item.name : item.brandName || item.name} logo={item.logo} />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
            {!loading && !filtered.length && (
              <p className="h-10 px-3 flex items-center text-sm text-slate-400">{emptyText}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
