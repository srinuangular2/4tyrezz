import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { mediaUrl, StatusPill } from './hubUtils';

export default function TestDrives() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/user/test-drives').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  }, []);

  return (
    <ProfileCard eyebrow="Schedule" title="My test drives">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading test drives…</p>}
      {rows && rows.length === 0 && <EmptyNote>No home or dealership test drives booked yet.</EmptyNote>}
      <div className="grid md:grid-cols-2 gap-4">
        {(rows || []).map((d) => (
          <article key={d.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex gap-3">
              <div className="w-20 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {d.vehicle?.images?.[0] ? <img src={mediaUrl(d.vehicle.images[0])} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">{d.vehicle?.title || 'Vehicle'}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {d.homeTestDrive ? 'Home test drive' : 'Dealership'} · {d.dealerName || 'Dealer'}
                </p>
                <p className="text-xs font-semibold text-slate-500">{d.location}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs font-bold text-slate-600">
                {d.preferredDate ? new Date(d.preferredDate).toLocaleDateString('en-IN') : ''} {d.preferredTime || ''}
              </p>
              <StatusPill value={d.status} />
            </div>
          </article>
        ))}
      </div>
    </ProfileCard>
  );
}
