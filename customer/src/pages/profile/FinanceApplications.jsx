import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { formatWhen, StatusPill, VehicleCard } from './hubUtils';

const STEP_SHORT = {
  'Under Review': 'Review',
  'Pre-Approved': 'Approved',
  'Documents Required': 'Documents',
  Disbursed: 'Paid',
};

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
      <div className="space-y-3">
        {(rows || []).map((row) => {
          const idx = steps.indexOf(row.status);
          return (
            <VehicleCard
              key={row.id}
              image={row.image || row.vehicle?.images?.[0]}
              title={row.vehicle?.title || 'Car loan'}
              price={row.loanAmount != null ? formatINR(row.loanAmount) : ''}
              facts={['Loan', row.tenureMonths ? `${row.tenureMonths} months` : 'Tenure pending', row.bankName || 'Bank partner assigning'].join(' · ')}
              when={formatWhen(row.createdAt, true)}
              status={<StatusPill value={row.status} />}
            >
              {steps.length > 0 ? (
                <div className="w-full basis-full">
                  <p className="text-[11px] font-medium text-slate-400">
                    Stage · <span className="font-semibold text-slate-800">{row.status}</span>
                  </p>
                  <ol className="mt-1.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                    {steps.map((step, i) => (
                      <li key={step} className="text-center">
                        <span className={`block h-1.5 rounded-full ${idx >= 0 && i <= idx ? 'bg-[#3083ff]' : 'bg-slate-200'}`} />
                        <span className={`mt-1 block text-[11px] font-medium leading-tight ${i === idx ? 'text-[#1853ff]' : i < idx ? 'text-slate-700' : 'text-slate-400'}`}>
                          {STEP_SHORT[step] || step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </VehicleCard>
          );
        })}
      </div>
    </ProfileCard>
  );
}
