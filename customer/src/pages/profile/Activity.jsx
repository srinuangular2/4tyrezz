import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { EmptyNote, ProfileCard } from './ProfileLayout';

const TYPE_LABEL = {
  test_drive: 'Test drive',
  valuation: 'Valuation',
  enquiry: 'Dealer enquiry',
  wishlist: 'Shortlist',
  garage: 'Garage',
  kyc: 'KYC',
  order: 'Order',
};

export default function Activity() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api
      .get('/user/activity')
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
  }, []);

  return (
    <ProfileCard eyebrow="Timeline" title="My activity">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading activity…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>No test drives, valuations or dealer enquiries yet.</EmptyNote>
      )}
      {rows && rows.length > 0 && (
        <ol className="space-y-3">
          {rows.map((a) => (
            <li key={`${a.type}-${a.id}`} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff]">{TYPE_LABEL[a.type] || a.type}</p>
              <p className="font-black text-slate-900 text-sm mt-0.5">{a.title}</p>
              {a.body && <p className="text-xs font-semibold text-slate-500 mt-1">{a.body}</p>}
              <p className="text-[11px] font-semibold text-slate-400 mt-2">
                {a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN') : ''}
                {a.link ? (
                  <>
                    {' · '}
                    <Link to={a.link} className="text-[#3083ff]">
                      View
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      )}
    </ProfileCard>
  );
}
