import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { sellStateFromRequest } from '../../components/sell/sellCarState';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { formatDateLabel, mediaUrl } from './hubUtils';

function expiryLabel(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 30);
  return formatDateLabel(date, true);
}

function VehicleRow({ row, onEdit, onPhotos }) {
  const meta = [
    row.kmDriven ? `${Number(row.kmDriven).toLocaleString('en-IN')} km` : '',
    row.fuel,
    row.city,
  ].filter(Boolean).join(' · ');
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex gap-3">
        <div className="h-[72px] w-[92px] shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {row.image ? (
            <img src={mediaUrl(row.image)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[22px]">🚗</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-semibold leading-snug text-slate-900">{row.title}{row.variant ? ` ${row.variant}` : ''}</p>
            <button type="button" onClick={onEdit} aria-label="Edit car" className="shrink-0 text-slate-500">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          {row.expectedPrice ? <p className="mt-0.5 text-[14px] font-semibold text-[#1853ff]">{formatINR(row.expectedPrice)}</p> : null}
          {meta ? <p className="mt-0.5 text-[12px] font-normal text-slate-500">{meta}</p> : null}
          <p className="mt-1 text-[11px] font-normal text-slate-400">
            {row.createdAt ? `Added ${formatDateLabel(row.createdAt, true)}` : ''}
            {row.createdAt ? ` · Until ${expiryLabel(row.createdAt)}` : ''}
          </p>
        </div>
      </div>
      {row.missing?.length > 0 && (
        <p className="mt-2 text-[12px] font-normal text-amber-700">Still needed: {row.missing.join(', ')}. Tap edit to fill them.</p>
      )}
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onPhotos} className="rounded-lg bg-[#3083ff] px-3 py-2 text-[12px] font-semibold text-white">
          {row.hasPhotos ? 'Add more photos' : 'Upload photos'}
        </button>
      </div>
    </article>
  );
}

export default function MyVehicles() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api
      .get('/user/sell-requests')
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
  }, []);

  const openEdit = (row) => {
    navigate('/sell', { state: { editRequest: sellStateFromRequest(row) } });
  };

  const openPhotos = (row) => {
    navigate('/sell', { state: { editRequest: sellStateFromRequest(row, { photoOnly: true }) } });
  };

  const active = (rows || []).filter((row) => row.active);
  const inactive = (rows || []).filter((row) => !row.active);

  return (
    <ProfileCard
      eyebrow="Selling"
      title="My vehicles"
      action={
        <Link to="/sell" className="text-[12px] font-semibold text-[#3083ff]">
          Sell a car
        </Link>
      }
    >
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading your cars…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          You have not booked a car for sale yet.{' '}
          <Link to="/valuation" className="font-semibold text-[#3083ff]">Check a price</Link>
          {' or '}
          <Link to="/sell" className="font-semibold text-[#3083ff]">sell your car</Link>
          .
        </EmptyNote>
      )}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Active</h2>
          {active.map((row) => (
            <VehicleRow key={row.id} row={row} onEdit={() => openEdit(row)} onPhotos={() => openPhotos(row)} />
          ))}
        </section>
      )}
      {inactive.length > 0 && (
        <section className={`space-y-3 ${active.length ? 'mt-5' : ''}`}>
          <h2 className="text-[15px] font-semibold text-slate-900">Inactive</h2>
          <p className="text-[12px] font-normal text-slate-500">These cars are missing details. Edit them to make the visit active.</p>
          {inactive.map((row) => (
            <VehicleRow key={row.id} row={row} onEdit={() => openEdit(row)} onPhotos={() => openPhotos(row)} />
          ))}
        </section>
      )}
    </ProfileCard>
  );
}
