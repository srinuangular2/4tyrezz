import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { describeFilters } from './hubUtils';

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
          return (
            <article
              key={row._id}
              className="rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {renaming === row._id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        rename(row);
                      }}
                    >
                      <input
                        autoFocus
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold"
                      />
                      <button type="submit" className="text-[11px] font-black text-[#3083ff]">Save</button>
                      <button type="button" onClick={() => setRenaming(null)} className="text-[11px] font-bold text-slate-400">Cancel</button>
                    </form>
                  ) : (
                    <>
                      <p className="font-black text-slate-900">{label}</p>
                      <div className="flex gap-3 mt-1">
                        <Link to={toQuery(row.filters)} className="text-[11px] font-black text-[#3083ff]">Open results</Link>
                        <button
                          type="button"
                          onClick={() => {
                            setRenaming(row._id);
                            setNameDraft(label);
                          }}
                          className="text-[11px] font-bold text-slate-400"
                        >
                          Rename
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => remove(row._id)} className="text-[11px] font-black text-rose-600">Remove</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs font-bold text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-[#3083ff]" checked={Boolean(row.newMatchAlerts ?? row.emailAlerts ?? row.alertsEnabled)} onChange={(e) => toggle(row, 'newMatchAlerts', e.target.checked)} />
                  New matching cars
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-[#3083ff]" checked={Boolean(row.priceChangeAlerts)} onChange={(e) => toggle(row, 'priceChangeAlerts', e.target.checked)} />
                  Price-change alerts
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-[#3083ff]" checked={Boolean(row.emailAlerts)} onChange={(e) => toggle(row, 'emailAlerts', e.target.checked)} />
                  Email alerts
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-[#3083ff]" checked={Boolean(row.whatsappAlerts)} onChange={(e) => toggle(row, 'whatsappAlerts', e.target.checked)} />
                  WhatsApp alerts
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </ProfileCard>
  );
}
