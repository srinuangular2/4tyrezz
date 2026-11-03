const CATEGORY_ORDER = ['exterior', 'mechanical', 'ac', 'electrical', 'vin'];

function printReport(booking, report) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
  if (!win) return;
  const rows = (report.categories || [])
    .map((cat) => `<tr><td>${cat.label}</td><td>${cat.status === 'pass' ? 'Pass' : 'Fail'}</td></tr>`)
    .join('');
  win.document.write(`<!doctype html><html><head><title>PDI report</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#0f172a} h1{margin:0 0 8px} table{width:100%;border-collapse:collapse;margin-top:16px} td,th{border:1px solid #e2e8f0;padding:8px;text-align:left}</style>
    </head><body>
    <h1>4tyrezz PDI health report</h1>
    <p>${booking.brand} ${booking.model} · ${booking.vinOrReg}</p>
    <p>${booking.pdiType === 'NEW_CAR' ? 'New car · dealer yard' : 'Used car · doorstep'} · ${booking.city}</p>
    <h2>Overall score ${report.score}/100</h2>
    <table><thead><tr><th>Category</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>
    ${(report.repaintedPanels || []).length ? `<p>Repainted panels: ${report.repaintedPanels.join(', ')}</p>` : ''}
    ${report.notes ? `<p>${report.notes}</p>` : ''}
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export default function PdiHealthReport({ booking, report }) {
  if (!report) return null;
  const categories = [...(report.categories || [])].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.key) - CATEGORY_ORDER.indexOf(b.key)
  );
  const tone = report.score >= 80 ? 'text-emerald-700 bg-emerald-50' : report.score >= 60 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff]">PDI health report</p>
          <p className="text-sm font-black text-slate-900 mt-1">{booking.brand} {booking.model}</p>
        </div>
        <div className={`rounded-2xl px-3 py-2 text-center ${tone}`}>
          <p className="text-2xl font-black leading-none">{report.score}</p>
          <p className="text-[10px] font-bold mt-1">/ 100</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {categories.map((cat) => (
          <li key={cat.key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-sm font-bold text-slate-800">{cat.label}</span>
            <span className={`text-[11px] font-black uppercase ${cat.status === 'pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {cat.status === 'pass' ? 'Pass' : 'Fail'}
            </span>
          </li>
        ))}
      </ul>
      {(report.repaintedPanels || []).length > 0 && (
        <p className="mt-3 text-xs font-semibold text-amber-700">
          Repainted: {report.repaintedPanels.join(', ')}
        </p>
      )}
      {report.notes && <p className="mt-2 text-xs text-slate-500">{report.notes}</p>}
      <button
        type="button"
        onClick={() => printReport(booking, report)}
        className="mt-4 w-full rounded-xl border border-[#3083ff] text-[#3083ff] text-xs font-black uppercase tracking-wider py-2.5"
      >
        Download PDF
      </button>
    </section>
  );
}
