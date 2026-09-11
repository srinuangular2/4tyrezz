import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { StatusPill } from './hubUtils';

export default function FinanceApplications() {
  const [rows, setRows] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    api.get('/user/finance-applications').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
    api.get('/meta/statuses').then((r) => setSteps(r.data.financeStatuses || [])).catch(() => setSteps([]));
  }, []);

  return (
    <ProfileCard eyebrow="Loans" title="Finance applications">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading applications…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          No loan requests yet.{' '}
          <Link to="/finance" className="text-[#3083ff] font-black">Start an application</Link>
        </EmptyNote>
      )}
      <div className="space-y-4">
        {(rows || []).map((row) => {
          const idx = steps.indexOf(row.status);
          return (
            <article key={row.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{row.vehicle?.title || 'Car loan'}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {formatINR(row.loanAmount)} · {row.tenureMonths ? `${row.tenureMonths} months` : 'Tenure pending'}
                    {row.bankName ? ` · ${row.bankName}` : ' · Bank partner assigning'}
                  </p>
                </div>
                <StatusPill value={row.status} />
              </div>
              {steps.length > 0 && (
                <>
                  <ol className="grid gap-2 mt-4" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                    {steps.map((step, i) => (
                      <li key={step} className={`h-1.5 rounded-full ${idx >= 0 && i <= idx ? 'bg-[#3083ff]' : 'bg-slate-100'}`} title={step} />
                    ))}
                  </ol>
                  <p className="text-[11px] font-bold text-slate-400 mt-2">{row.status}</p>
                </>
              )}
            </article>
          );
        })}
      </div>
    </ProfileCard>
  );
}
