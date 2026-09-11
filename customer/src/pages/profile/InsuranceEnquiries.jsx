import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { StatusPill } from './hubUtils';

export default function InsuranceEnquiries() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/user/insurance-enquiries').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  }, []);

  return (
    <ProfileCard eyebrow="Cover" title="Insurance enquiries">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading insurance quotes…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          No motor insurance quotes yet.{' '}
          <Link to="/insurance" className="text-[#3083ff] font-black">Request a quote</Link>
        </EmptyNote>
      )}
      <div className="space-y-3">
        {(rows || []).map((row) => (
          <article key={row.id} className="rounded-2xl border border-slate-100 px-4 py-4 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-black text-slate-900">{row.vehicle?.title || row.insuranceType || 'Motor insurance'}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {(row.addOns || []).join(', ') || 'No add-ons selected'}
                {row.premium != null ? ` · ${formatINR(row.premium)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill value={row.status} />
              <Link to="/insurance" className="text-[11px] font-black text-[#3083ff]">Renew / purchase</Link>
            </div>
          </article>
        ))}
      </div>
    </ProfileCard>
  );
}
