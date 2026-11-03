import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { StatusPill, VehicleCard } from './hubUtils';

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
          <VehicleCard
            key={row.id}
            image={row.image || row.vehicle?.images?.[0]}
            title={row.vehicle?.title || row.insuranceType || 'Motor insurance'}
            price={row.premium != null ? formatINR(row.premium) : ''}
            facts={[row.insuranceType, (row.addOns || []).join(', ') || 'No add-ons selected'].filter(Boolean).join(' · ')}
            status={<StatusPill value={row.status} />}
          >
            <Link to="/insurance" className="text-[12px] font-semibold text-[#3083ff]">Renew / purchase</Link>
          </VehicleCard>
        ))}
      </div>
    </ProfileCard>
  );
}
