import { useState } from 'react';
import { glass } from './admin/ui';

export default function DataTable({
  columns,
  rows,
  page,
  pages,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search…',
  selectable,
  selected = [],
  onToggle,
}) {
  const [q, setQ] = useState('');

  return (
    <div className={`${glass} rounded-2xl overflow-hidden`}>
      {onSearch && (
        <div className="p-4 border-b border-slate-800/80">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch(q)}
            placeholder={searchPlaceholder}
            className="w-full max-w-xs bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-xl text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              {selectable && <th className="px-4 py-3 w-8" />}
              {columns.map((c) => (
                <th key={c.key} className="text-left px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-10 text-slate-500">
                  No records found.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row._id} className="border-t border-slate-800/70 hover:bg-white/[0.03]">
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(row._id)}
                      onChange={() => onToggle?.(row._id)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-middle text-slate-200">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-2 p-4 border-t border-slate-800/80">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 text-sm text-slate-300 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500 px-2 py-1.5">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 text-sm text-slate-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
