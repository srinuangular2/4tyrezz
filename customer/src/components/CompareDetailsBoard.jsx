import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { formatINR } from './PageShell';
import { compareShortName } from './CompareVsCard';
import { COMPARE_GROUPS, COMPARE_MAX, rowIsSame, winners } from '../lib/compareMatrix';

function metaLine(c) {
  return [c.variant, c.year, c.fuel].filter(Boolean).join(' · ');
}

function vsTitle(cars) {
  return cars.map((c) => [c.brand, compareShortName(c)].filter(Boolean).join(' ')).join(' vs ') + ' comparison';
}

function Controls({ hideSame, setHideSame, highlightDiff, setHighlightDiff, compact }) {
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 font-medium text-slate-600 ${compact ? 'flex-col text-xs' : 'flex-row text-sm'}`}>
      <label className="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={hideSame}
          onChange={(e) => setHideSame(e.target.checked)}
          className="accent-[#3083ff] w-4 h-4"
        />
        Hide same features
      </label>
      <label className="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={highlightDiff}
          onChange={(e) => setHighlightDiff(e.target.checked)}
          className="accent-[#3083ff] w-4 h-4"
        />
        Show differences
      </label>
    </div>
  );
}

function TabBar({ activeTab, onJump, query, setQuery }) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, []);

  const nudge = (dir) => {
    scrollerRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <div className="flex items-center gap-2 border-b border-slate-200">
      {canLeft && (
        <button
          type="button"
          aria-label="Previous tabs"
          onClick={() => nudge(-1)}
          className="shrink-0 w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] flex items-center justify-center font-bold"
        >
          ‹
        </button>
      )}
      <div
        ref={scrollerRef}
        className="flex gap-1 overflow-x-auto flex-1 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Compare sections"
      >
        {COMPARE_GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={activeTab === g.key}
            onClick={() => onJump(g.key)}
            className={`shrink-0 px-3 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
              activeTab === g.key
                ? 'text-[#3083ff] border-[#3083ff]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            {g.tab}
          </button>
        ))}
      </div>
      {canRight && (
        <button
          type="button"
          aria-label="Next tabs"
          onClick={() => nudge(1)}
          className="shrink-0 w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] flex items-center justify-center font-bold"
        >
          ›
        </button>
      )}
      <div className="hidden md:flex items-center gap-2 shrink-0 px-3 py-1.5 mb-2 rounded-full border border-slate-200 bg-slate-50">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a feature e.g. Sunroof"
          className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function AddCarSlot({ onClick, compact, short }) {
  if (short) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[148px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500"
      >
        <Plus className="h-5 w-5" />
        <span className="text-[13px] font-semibold">Add a car</span>
      </button>
    );
  }
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-16 h-16 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-[#3083ff] hover:text-[#3083ff] flex flex-col items-center justify-center gap-0.5 shrink-0"
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
        <span className="text-[9px] font-semibold">Add car</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[280px] rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-[#3083ff] hover:text-[#3083ff] transition"
    >
      <span className="w-16 h-16 rounded-full border border-dashed border-current flex items-center justify-center">
        <Plus className="w-7 h-7" strokeWidth={1.75} />
      </span>
      <span className="text-sm font-semibold">Add car</span>
    </button>
  );
}

export default function CompareDetailsBoard({ cars = [], ids = [], onRemove, onAddClick }) {
  const heroRef = useRef(null);
  const sectionRefs = useRef({});
  const [compact, setCompact] = useState(false);
  const [hideSame, setHideSame] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [activeTab, setActiveTab] = useState(COMPARE_GROUPS[0].key);
  const [collapsed, setCollapsed] = useState({});
  const [query, setQuery] = useState('');

  const showAdd = ids.length < COMPARE_MAX;
  const q = query.trim().toLowerCase();

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      rootMargin: '-80px 0px 0px 0px',
      threshold: 0,
    });
    io.observe(node);
    return () => io.disconnect();
  }, [cars.length]);

  const jumpTo = (key) => {
    setActiveTab(key);
    setCollapsed((c) => ({ ...c, [key]: false }));
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (cars.length < 2) return null;

  return (
    <div id="compare-details" className="max-w-6xl mx-auto">
      {compact && (
        <div className="sticky top-1 z-30 border-b border-slate-200 bg-white shadow-sm lg:hidden">
          <div className="grid gap-2 px-3 py-2" style={{ gridTemplateColumns: `repeat(${cars.length}, minmax(0, 1fr))` }}>
            {cars.map((c) => (
              <div key={c.id} className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-slate-900">{compareShortName(c)}</p>
                <p className="text-[12px] font-semibold text-[#1853ff]">{formatINR(c.price)}</p>
              </div>
            ))}
          </div>
          <div className="px-2">
            <TabBar activeTab={activeTab} onJump={jumpTo} query={query} setQuery={setQuery} />
          </div>
        </div>
      )}

      {compact && (
        <div className="sticky top-16 z-30 hidden border-b border-slate-200 bg-white shadow-sm lg:block">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-4 overflow-x-auto">
            <Controls
              hideSame={hideSame}
              setHideSame={setHideSame}
              highlightDiff={highlightDiff}
              setHighlightDiff={setHighlightDiff}
              compact
            />
            <div className="flex items-center gap-4 ml-auto">
              {cars.map((c, i) => (
                <div key={c.id} className="relative flex items-center gap-2 shrink-0">
                  {i === 1 && (
                    <span className="absolute -left-5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#3083ff] text-white text-[10px] font-black leading-none flex items-center justify-center">
                      <span className="translate-y-px">VS</span>
                    </span>
                  )}
                  <img src={c.images?.[0] || '/pwa-192.png'} alt="" className="w-14 h-10 object-cover rounded-md bg-slate-100" />
                  <div className="min-w-0 hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                      {c.brand} {compareShortName(c)}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{c.variant || metaLine(c)}</p>
                    <p className="text-xs font-bold text-slate-800">{formatINR(c.price)}</p>
                  </div>
                </div>
              ))}
              {showAdd && <AddCarSlot onClick={onAddClick} compact />}
            </div>
          </div>
          <div className="px-4 sm:px-6">
            <TabBar activeTab={activeTab} onJump={jumpTo} query={query} setQuery={setQuery} />
          </div>
        </div>
      )}

      <div ref={heroRef} className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-8">
        <h1 className="text-[16px] font-semibold leading-snug text-slate-900 lg:hidden">
          {cars.map((c) => compareShortName(c)).join(' vs ')}
        </h1>
        <h1 className="mb-6 hidden text-2xl font-bold text-slate-900 lg:block">{vsTitle(cars)}</h1>
        <div className="mt-3 flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setHideSame((v) => !v)}
            className={`h-9 flex-1 rounded-full text-[12px] font-semibold ${hideSame ? 'bg-[#3083ff] text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Hide matches
          </button>
          <button
            type="button"
            onClick={() => setHighlightDiff((v) => !v)}
            className={`h-9 flex-1 rounded-full text-[12px] font-semibold ${highlightDiff ? 'bg-[#3083ff] text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Differences
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 items-start gap-4 lg:mt-0 lg:grid-cols-[180px_1fr] lg:gap-6">
          <div className="hidden lg:block">
            <Controls
              hideSame={hideSame}
              setHideSame={setHideSame}
              highlightDiff={highlightDiff}
              setHighlightDiff={setHighlightDiff}
            />
          </div>
          <div>
            <div className={`grid grid-cols-2 gap-2.5 lg:gap-4 ${showAdd ? 'lg:grid-cols-3' : cars.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
              {cars.map((c) => (
                <article key={c.id} className="relative text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(c.id)}
                    className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm"
                    aria-label={`Remove ${compareShortName(c)}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <img
                    src={c.images?.[0] || '/pwa-192.png'}
                    alt={c.title}
                    className="h-24 w-full rounded-xl bg-slate-50 object-cover lg:h-48 lg:object-contain"
                  />
                  <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 lg:mt-3 lg:text-base">
                    {compareShortName(c)}
                  </p>
                  <p className="mt-0.5 hidden text-sm text-slate-500 lg:block">{c.variant || metaLine(c)}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#1853ff] lg:text-base lg:font-bold lg:text-slate-900">{formatINR(c.price)}</p>
                  <Link
                    to={`/cars/${c.id}`}
                    className="mt-1 inline-flex text-[12px] font-semibold text-[#3083ff] lg:mt-3 lg:w-full lg:items-center lg:justify-center lg:rounded-lg lg:border lg:border-[#3083ff] lg:py-2.5 lg:text-sm"
                  >
                    View listing
                  </Link>
                </article>
              ))}
              {showAdd && (
                <div className="hidden lg:block">
                  <AddCarSlot onClick={onAddClick} />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 lg:hidden">
              {showAdd ? (
                <button type="button" onClick={onAddClick} className="text-[13px] font-semibold text-[#3083ff]">
                  Add another car
                </button>
              ) : <span />}
              <p className="text-[12px] font-normal text-slate-400">{cars.length} of {COMPARE_MAX}</p>
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 bg-white rounded-2xl border border-slate-200 px-4 sm:px-6">
          <TabBar activeTab={activeTab} onJump={jumpTo} query={query} setQuery={setQuery} />
        </div>
      )}

      <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 lg:hidden">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a feature, such as sunroof"
          className="w-full bg-transparent text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="mt-3 space-y-3 pb-24 lg:mt-4 lg:space-y-4 lg:pb-10">
        {COMPARE_GROUPS.map((group) => {
          const visibleRows = group.rows.filter(([label, fn]) => {
            if (q && !String(label).toLowerCase().includes(q)) return false;
            if (hideSame && rowIsSame(cars, fn)) return false;
            return true;
          });
          if (!visibleRows.length) return null;
          const isClosed = collapsed[group.key];
          return (
            <section
              key={group.key}
              ref={(el) => {
                sectionRefs.current[group.key] = el;
              }}
              className="scroll-mt-40 bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-bold text-slate-900">{group.label}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition ${isClosed ? '-rotate-90' : ''}`} />
              </button>
              {!isClosed && (
                <div className="border-t border-slate-100 lg:hidden">
                  {visibleRows.map(([label, fn, mode], idx) => {
                    const win = winners(cars, fn, mode);
                    const same = rowIsSame(cars, fn);
                    const differ = highlightDiff && !same;
                    return (
                      <div key={label} className={`px-3.5 py-3 ${differ ? 'bg-blue-50/70' : idx % 2 ? 'bg-slate-50/80' : 'bg-white'}`}>
                        <p className="text-[12px] font-normal text-slate-500">{label}</p>
                        <div className="mt-1.5 grid" style={{ gridTemplateColumns: `repeat(${cars.length}, minmax(0, 1fr))` }}>
                          {cars.map((c, index) => (
                            <p key={c.id + label} className={`break-words px-1 text-[13px] leading-snug ${index > 0 ? 'border-l border-slate-200' : ''} ${win.has(c.id) ? 'font-semibold text-[#1853ff]' : 'font-medium text-slate-800'}`}>
                              {fn(c)}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!isClosed && (
                <div className="hidden overflow-x-auto border-t border-slate-100 lg:block">
                  <table className="w-full min-w-[640px] text-sm">
                    <tbody>
                      {visibleRows.map(([label, fn, mode], idx) => {
                        const win = winners(cars, fn, mode);
                        const same = rowIsSame(cars, fn);
                        const differ = highlightDiff && !same;
                        return (
                          <tr key={label} className={differ ? 'bg-blue-50/60' : idx % 2 ? 'bg-slate-50/70' : 'bg-white'}>
                            <th className="w-48 sm:w-56 p-4 text-left font-medium text-slate-600 align-top border-r border-slate-100">
                              {label}
                            </th>
                            {cars.map((c) => (
                              <td key={c.id + label} className="p-4 text-slate-800 font-medium align-top">
                                <span className={win.has(c.id) ? 'text-[#3083ff] font-semibold' : ''}>{fn(c)}</span>
                              </td>
                            ))}
                            {showAdd && <td className="p-4" />}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
