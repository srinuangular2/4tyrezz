import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { StatusPill, VehicleCard } from './hubUtils';

function visitLine(row) {
  const when = [row.inspectionDate, row.inspectionSlot].filter(Boolean).join(' · ');
  return [when || 'Visit time not set', row.city, row.plate].filter(Boolean).join(' · ');
}

export default function SellRequests() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api
      .get('/user/sell-requests')
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
  }, []);

  return (
    <ProfileCard
      eyebrow="Selling"
      title="Sell my car"
      action={
        <Link to="/sell" className="text-[12px] font-semibold text-[#3083ff]">
          Sell another car
        </Link>
      }
    >
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading your cars…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          You have not booked a sell visit yet.{' '}
          <Link to="/valuation" className="text-[#3083ff] font-semibold">Check a price</Link>
          {' or '}
          <Link to="/sell" className="text-[#3083ff] font-semibold">sell your car</Link>
          .
        </EmptyNote>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <VehicleCard
              key={row.id}
              image={row.image}
              title={[row.title, row.variant].filter(Boolean).join(' · ')}
              price={row.expectedPrice ? formatINR(row.expectedPrice) : ''}
              facts={visitLine(row)}
              note={
                row.minPrice && row.maxPrice
                  ? `Market range ${formatINR(row.minPrice)} – ${formatINR(row.maxPrice)}`
                  : ''
              }
              status={<StatusPill value={row.status} />}
            />
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
