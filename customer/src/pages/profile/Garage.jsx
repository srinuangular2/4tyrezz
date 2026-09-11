import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useVehicleBrands, useVehicleModels } from '../../hooks/useVehicleCatalog';
import { inputClass } from '../../lib/kycValidation';
import { EmptyNote, ProfileCard } from './ProfileLayout';

const blank = {
  brand: '',
  model: '',
  year: '',
  registrationNumber: '',
  fuel: '',
  lastServiceAt: '',
  lastServiceNotes: '',
  rtoNotes: '',
};

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name || '';
}

export default function Garage() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const { brands, loading: loadingBrands } = useVehicleBrands();
  const { models, loading: loadingModels } = useVehicleModels(form.brand);
  const brandNames = useMemo(() => (brands || []).map(nameOf).filter(Boolean), [brands]);
  const modelNames = useMemo(() => (models || []).map(nameOf).filter(Boolean), [models]);

  const load = () =>
    api
      .get('/user/garage')
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const add = async (e) => {
    e.preventDefault();
    if (!form.brand || !form.model) {
      toast.error('Select brand and model');
      return;
    }
    setSaving(true);
    try {
      await api.post('/user/garage', form);
      setForm(blank);
      toast.success('Added to garage');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/user/garage/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <ProfileCard eyebrow="Owned cars" title="My garage">
        {rows === null && <p className="text-sm font-semibold text-slate-500">Loading garage…</p>}
        {rows && rows.length === 0 && <EmptyNote>No owned cars on file yet. Add one below.</EmptyNote>}
        {rows && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((v) => (
              <div key={v._id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900 text-sm">
                      {v.brand} {v.model} {v.year ? `· ${v.year}` : ''}
                    </p>
                    {v.registrationNumber && (
                      <p className="text-xs font-bold text-slate-500 mt-1">{v.registrationNumber}</p>
                    )}
                    {v.rtoNotes && <p className="text-xs font-semibold text-slate-400 mt-1">RTO: {v.rtoNotes}</p>}
                    {v.lastServiceNotes && (
                      <p className="text-xs font-semibold text-slate-400 mt-1">Service: {v.lastServiceNotes}</p>
                    )}
                  </div>
                  <button type="button" onClick={() => remove(v._id)} className="text-[11px] font-black text-rose-600">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileCard>

      <ProfileCard eyebrow="Add" title="Register a car you own">
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Brand</span>
            <select className={`${inputClass} mt-1.5`} value={form.brand} disabled={loadingBrands} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value, model: '' }))}>
              <option value="">{loadingBrands ? 'Loading brands…' : ''}</option>
              {brandNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Model</span>
            <select className={`${inputClass} mt-1.5`} value={form.model} disabled={!form.brand || loadingModels} onChange={(e) => set('model', e.target.value)}>
              <option value="" />
              {modelNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Year</span>
            <input className={`${inputClass} mt-1.5`} value={form.year} onChange={(e) => set('year', e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Registration number</span>
            <input className={`${inputClass} mt-1.5`} value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value.toUpperCase())} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Last service date</span>
            <input className={`${inputClass} mt-1.5`} value={form.lastServiceAt} type="date" onChange={(e) => set('lastServiceAt', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Service notes</span>
            <input className={`${inputClass} mt-1.5`} value={form.lastServiceNotes} onChange={(e) => set('lastServiceNotes', e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">RTO record notes</span>
            <input className={`${inputClass} mt-1.5`} value={form.rtoNotes} onChange={(e) => set('rtoNotes', e.target.value)} />
          </label>
          <button disabled={saving} className="sm:col-span-2 bg-[#3083ff] text-white font-black rounded-2xl py-3">
            {saving ? 'Saving…' : 'Add to garage'}
          </button>
        </form>
      </ProfileCard>
    </div>
  );
}
