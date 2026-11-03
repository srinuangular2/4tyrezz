import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { formatWhen, StatusPill, VehicleCard } from './hubUtils';

const KIND_LABEL = {
  seller: 'Sell request',
  vehicle: 'Car enquiry',
  dealer: 'Dealer enquiry',
  exchange: 'Exchange',
};

export default function Enquiries() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/user/enquiries').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  }, []);

  return (
    <ProfileCard eyebrow="Inbox" title="My enquiries">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading enquiries…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          No questions about cars for sale yet.{' '}
          <Link to="/cars" className="text-[#3083ff] font-semibold">Browse cars</Link>
        </EmptyNote>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <VehicleCard
              key={row.id}
              image={row.image}
              title={row.title}
              price={row.price != null ? formatINR(row.price) : ''}
              facts={[row.year, row.fuel, KIND_LABEL[row.kind] || row.kind].filter(Boolean).join(' · ')}
              when={formatWhen(row.createdAt, true)}
              note={row.message}
              status={<StatusPill value={row.status} />}
            >
              {row.carId ? <Link to={`/cars/${row.carId}`} className="text-[12px] font-semibold text-[#3083ff]">View car</Link> : null}
            </VehicleCard>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

