import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { describeFilters } from './hubUtils';

function isId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || '').trim());
}

function filterChips(filters = {}) {
  const chips = [];
  const add = (value) => {
    String(value || '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part && !isId(part))
      .forEach((part) => chips.push(part));
  };
  add(filters.brand);
  add(filters.model);
  add(filters.fuel);
  add(filters.transmission);
  add(filters.bodyType);
  add(filters.color);
  if (filters.seats) chips.push(`${filters.seats} seats`);
  if (filters.city && !isId(filters.city)) chips.push(filters.city);
  if (filters.rto) chips.push(`RTO ${filters.rto}`);
  if (filters.minPrice || filters.maxPrice) {
    const from = filters.minPrice ? formatINR(filters.minPrice) : '';
    const to = filters.maxPrice ? formatINR(filters.maxPrice) : '';
    chips.push(from && to ? `${from} – ${to}` : to ? `Under ${to}` : `From ${from}`);
  }
  return [...new Set(chips)].slice(0, 6);
}

const ALERTS = [
  ['newMatchAlerts', 'New matching cars', (row) => Boolean(row.newMatchAlerts ?? row.emailAlerts ?? row.alertsEnabled)],
  ['priceChangeAlerts', 'Price-change alerts', (row) => Boolean(row.priceChangeAlerts)],
  ['emailAlerts', 'Email alerts', (row) => Boolean(row.emailAlerts)],
  ['whatsappAlerts', 'WhatsApp alerts', (row) => Boolean(row.whatsappAlerts)],
];

function toQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v != null && k !== 'page') params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `/cars?${q}` : '/cars';
}

export default function SavedSearches() {
  const [rows, setRows] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [nameDraft, setNameDraft] = useState('');

  const load = () =>
    api.get('/user/saved-searches').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (row, key, value) => {
    try {
      const { data } = await api.patch(`/user/saved-searches/${row._id}/alerts`, { [key]: value });
      setRows((list) => (list || []).map((r) => (r._id === row._id ? data.data : r)));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update alerts');
    }
  };

  const rename = async (row) => {
    const name = nameDraft.trim();
    if (!name) return;
    try {
      const { data } = await api.put(`/saved-searches/${row._id}`, { name });
      setRows((list) => (list || []).map((r) => (r._id === row._id ? data.data : r)));
      setRenaming(null);
      toast.success('Renamed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not rename');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/saved-searches/${id}`);
      setRows((list) => (list || []).filter((r) => r._id !== id));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not remove search');
    }
  };

  return (
    <ProfileCard eyebrow="Alerts" title="My saved searches">
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading saved searches…</p>}
      {rows && rows.length === 0 && (
        <EmptyNote>
          No saved filters yet. Apply filters on the{' '}
          <Link to="/cars" className="text-[#3083ff] font-black">car listing</Link> and save that search.
        </EmptyNote>
      )}
      <div className="space-y-3">
        {(rows || []).map((row) => {
          const label = row.name && row.name !== 'Saved search' ? row.name : describeFilters(row.filters, row.name);
          const chips = filterChips(row.filters).filter((chip) => chip.toLowerCase() !== String(label).toLowerCase());
          return (
            <article key={row._id} className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <div className="p-3.5">
                {renaming === row._id ? (
                  <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      rename(row);
                    }}
                  >
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-900"
                    />
                    <button type="submit" className="text-[12px] font-semibold text-[#3083ff]">Save</button>
                    <button type="button" onClick={() => setRenaming(null)} className="text-[12px] font-medium text-slate-500">Cancel</button>
                  </form>
                ) : (
                  <>
                    <p className="text-[13px] font-semibold leading-snug text-slate-900">{label}</p>
                    {chips.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                          <span key={chip} className="rounded-full bg-[#eaf2ff] px-2 py-0.5 text-[11px] font-medium text-[#1853ff]">
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-3">
                      <Link to={toQuery(row.filters)} className="text-[12px] font-semibold text-[#3083ff]">Open results</Link>
                      <button
                        type="button"
                        onClick={() => {
                          setRenaming(row._id);
                          setNameDraft(label);
                        }}
                        className="text-[12px] font-medium text-slate-500"
                      >
                        Rename
                      </button>
                      <button type="button" onClick={() => remove(row._id)} className="text-[12px] font-semibold text-rose-500">Remove</button>
                    </div>
                  </>
                )}
              </div>
              <div className="border-t border-slate-100 px-3.5 py-3">
                <p className="text-[11px] font-medium text-slate-400">Alerts</p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                  {ALERTS.map(([key, text, checked]) => (
                    <label key={key} className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-[#3083ff]"
                        checked={checked(row)}
                        onChange={(e) => toggle(row, key, e.target.checked)}
                      />
                      {text}
                    </label>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </ProfileCard>
  );
}
