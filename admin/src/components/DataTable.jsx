import { useState } from 'react';

// Generic table shell: search box + column config + row actions + pagination bar.
// Kept framework-light (no MUI DataGrid) to stay easy to read and extend.
export default function DataTable({ columns, rows, page, pages, onPageChange, onSearch, searchPlaceholder = 'Search…' }) {
  const [q, setQ] = useState('');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {onSearch && (
        <div className="p-4 border-b border-slate-100">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch(q)}
            placeholder={searchPlaceholder}
            className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate2">
            <tr>{columns.map((c) => <th key={c.key} className="text-left px-4 py-3 font-semibold">{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="text-center py-10 text-slate2">No records found.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                {columns.map((c) => <td key={c.key} className="px-4 py-3 align-middle">{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-2 p-4 border-t border-slate-100">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-slate2 px-2 py-1.5">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
