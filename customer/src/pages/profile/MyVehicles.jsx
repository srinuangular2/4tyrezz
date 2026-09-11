import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';

const STATUS_TONE = {
  'In Review': 'bg-amber-50 text-amber-700',
  Verified: 'bg-emerald-50 text-emerald-700',
  Sold: 'bg-slate-100 text-slate-600',
  'Active Bids': 'bg-blue-50 text-[#1853ff]',
  Rejected: 'bg-rose-50 text-rose-700',
};

export default function MyVehicles() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api
      .get('/user/my-vehicles')
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
  }, []);

  return (
    <ProfileCard
      eyebrow="Listings"
      title="My vehicles"
      action={
        <Link to="/sell" className="text-xs font-black uppercase tracking-wider text-[#3083ff]">
          Post a car
        </Link>
      }
    >
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading listings…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          You have not posted a car for sale.{' '}
          <Link to="/sell" className="text-[#3083ff] font-black">
            Sell your car
          </Link>
        </EmptyNote>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <div>
                <p className="font-black text-slate-900 text-sm">{c.title}</p>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {formatINR(c.price)} · {c.bidCount || 0} buyer leads
                </p>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${STATUS_TONE[c.liveStatus] || 'bg-slate-100 text-slate-600'}`}>
                {c.liveStatus}
              </span>
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
