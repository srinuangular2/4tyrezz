import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';

const emptyForm = { title: '', subtitle: '', ctaLabel: 'Learn more', linkType: 'none', car: '', url: '', order: 0, isActive: true };

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [cars, setCars] = useState([]);
  const [editing, setEditing] = useState(null); // null closed, {} new, {...} edit
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null); // single file — used when editing
  const [imageFiles, setImageFiles] = useState([]); // multiple files — used when adding

  const load = () => api.get('/banners/all').then((r) => setBanners(r.data));
  useEffect(() => {
    load();
    api.get('/cars', { params: { limit: 200, status: 'approved' } }).then((r) => setCars(r.data.cars));
  }, []);

  const openNew = () => { setForm(emptyForm); setImageFile(null); setImageFiles([]); setEditing({}); };
  const openEdit = (b) => {
    setForm({
      title: b.title || '', subtitle: b.subtitle || '', ctaLabel: b.ctaLabel || 'Learn more',
      linkType: b.linkType || 'none', car: b.car?._id || '', url: b.url || '', order: b.order || 0, isActive: b.isActive,
    });
    setImageFile(null);
    setImageFiles([]);
    setEditing(b);
  };

  const save = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));

    if (editing._id) {
      if (imageFile) data.append('image', imageFile);
      await api.put(`/banners/${editing._id}`, data);
    } else {
      if (!imageFiles.length) return alert('Please choose at least one banner image');
      imageFiles.forEach((f) => data.append('images', f));
      await api.post('/banners/bulk', data);
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => { if (!confirm('Delete this banner?')) return; await api.delete(`/banners/${id}`); load(); };
  const toggleActive = async (b) => { await api.put(`/banners/${b._id}`, { isActive: !b.isActive }); load(); };
  const move = async (b, dir) => { await api.put(`/banners/${b._id}`, { order: (b.order || 0) + dir }); load(); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-semibold text-2xl">Hero Banners</h1>
          <p className="text-slate2 text-sm mt-1">Controls the auto-playing slider on the customer homepage. Order controls display sequence.</p>
        </div>
        <button onClick={openNew} className="bg-ember hover:bg-ember-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Banner</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {banners.length === 0 && <p className="text-slate2 text-sm p-6">No banners yet — the customer site will show a default fallback slide.</p>}
        {banners.map((b) => (
          <div key={b._id} className="flex items-center gap-4 px-5 py-3">
            <img src={b.image} className="w-24 h-14 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{b.title || <span className="text-slate2 italic">No title</span>}</p>
              <p className="text-xs text-slate2 mt-0.5">
                {b.linkType === 'car' ? `Links to: ${b.car?.title || 'a car'}` : b.linkType === 'url' ? `Links to: ${b.url}` : 'No link'}
                {' · Order '}{b.order}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => move(b, -1)} className="w-7 h-7 rounded border border-slate-200 text-xs" title="Move earlier">↑</button>
              <button onClick={() => move(b, 1)} className="w-7 h-7 rounded border border-slate-200 text-xs" title="Move later">↓</button>
            </div>
            <button onClick={() => toggleActive(b)} className={`text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap ${b.isActive ? 'bg-verify-bg text-verify' : 'bg-slate-200 text-slate-600'}`}>
              {b.isActive ? 'Active' : 'Inactive'}
            </button>
            <button onClick={() => openEdit(b)} className="text-ember text-xs font-bold">Edit</button>
            <button onClick={() => remove(b._id)} className="text-red-600 text-xs font-bold">Delete</button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing._id ? 'Edit Banner' : 'Add Banner'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-3">
            {editing._id ? (
              <>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm w-full" />
                {editing.image && !imageFile && <img src={editing.image} className="w-full h-28 object-cover rounded-lg" />}
              </>
            ) : (
              <>
                <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles([...e.target.files])} className="text-sm w-full" />
                <p className="text-xs text-slate2">
                  {imageFiles.length > 1
                    ? `${imageFiles.length} images selected — one banner slide will be created per image, sharing the settings below.`
                    : 'Select multiple images to create several banner slides in one go.'}
                </p>
                {imageFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {imageFiles.map((f, i) => (
                      <img key={i} src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </>
            )}
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Button label (e.g. Browse cars)" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />

            <select value={form.linkType} onChange={(e) => setForm({ ...form, linkType: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="none">No link (promotional only)</option>
              <option value="car">Link to a specific car</option>
              <option value="url">Link to a URL / page</option>
            </select>

            {form.linkType === 'car' && (
              <select required value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select a car</option>
                {cars.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            )}
            {form.linkType === 'url' && (
              <input required placeholder="/cars or https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            )}

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate2">Display order</label>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate2 ml-auto">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>

            <button className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-2.5 rounded-lg">
              {editing._id ? 'Save banner' : imageFiles.length > 1 ? `Create ${imageFiles.length} banner slides` : 'Save banner'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
