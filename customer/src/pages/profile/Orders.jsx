import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';

const TYPE_LABEL = {
  purchase: 'Car purchase',
  inspection: 'Inspection booking',
  evaluation: 'Evaluation request',
  token_payment: 'Token payment',
};

export default function Orders() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/user/orders')
      .then((r) => setRows(r.data.data || []))
      .catch((e) => {
        setRows([]);
        setError(e.response?.data?.message || 'Could not load orders');
      });
  }, []);

  return (
    <ProfileCard eyebrow="Account" title="My orders">
      {error && <p className="text-sm font-semibold text-rose-600 mb-3">{error}</p>}
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading orders…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          No purchases, inspections, valuations or token payments yet.{' '}
          <Link to="/cars" className="text-[#3083ff] font-black">Browse cars</Link>
        </EmptyNote>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((o) => (
            <div key={`${o.source}-${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{TYPE_LABEL[o.type] || o.type}</p>
                <p className="font-black text-slate-900 text-sm mt-0.5">{o.title}</p>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {o.refId ? `#${o.refId} · ` : ''}
                  {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : ''}
                </p>
              </div>
              <div className="text-right">
                {o.amount ? <p className="font-black text-slate-900">{formatINR(o.amount)}</p> : null}
                <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff] mt-1">{o.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
