export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const items = Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2);
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-40 text-sm font-medium hover:bg-slate-50">Prev</button>
      {items.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold ${p === page ? 'bg-ink text-white' : 'border border-slate-200 hover:bg-slate-50'}`}
        >
          {p}
        </button>
      ))}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-40 text-sm font-medium hover:bg-slate-50">Next</button>
    </div>
  );
}
