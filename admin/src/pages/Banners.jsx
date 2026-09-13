import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { inputCls } from '../components/admin/ui';

const emptyForm = { title: '', titleLine2: '', subtitle: '', ctaLabel: 'Learn more', linkType: 'none', car: '', url: '', isActive: true };

function moveItem(list, fromId, toId) {
  const next = [...list];
  const from = next.findIndex((b) => b._id === fromId);
  const to = next.findIndex((b) => b._id === toId);
  if (from < 0 || to < 0 || from === to) return list;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [cars, setCars] = useState([]);
  const [editing, setEditing] = useState(null); // null closed, {} new, {...} edit
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = () => api.get('/banners/all').then((r) => setBanners(r.data));
  useEffect(() => {
    load();
    api.get('/cars', { params: { limit: 200, status: 'approved' } }).then((r) => setCars(r.data.cars));
  }, []);

  const persistOrder = async (next) => {
    const previous = banners;
    setBanners(next);
    setSavingOrder(true);
    try {
      const { data } = await api.put('/banners/reorder', { ids: next.map((b) => b._id) });
      setBanners(data);
    } catch {
      setBanners(previous);
    } finally {
      setSavingOrder(false);
    }
  };

  const openNew = () => { setForm(emptyForm); setImageFile(null); setImageFiles([]); setEditing({}); };
  const openEdit = (b) => {
    setForm({
      title: b.titleLine1 || b.title || '', titleLine2: b.titleLine2 || '', subtitle: b.subtitle || '',
      ctaLabel: b.ctaLabel || 'Learn more',
      linkType: b.linkType || 'none', car: b.car?._id || '', url: b.url || '', isActive: b.isActive,
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-semibold text-2xl text-white">Hero Banners</h1>
          <p className="text-slate-400 text-sm mt-1">
            Drag the handle to change homepage slider order. First row plays first.
            {savingOrder ? ' Saving order…' : ''}
          </p>
        </div>
        <button onClick={openNew} className="bg-ember hover:bg-ember-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Banner</button>
      </div>

      <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {banners.length === 0 && <p className="text-slate-500 text-sm p-6">No banners yet — the customer site will show a default fallback slide.</p>}
        {banners.map((b, index) => (
          <div
            key={b._id}
            draggable
            onDragStart={(e) => {
              setDragId(b._id);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', b._id);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (overId !== b._id) setOverId(b._id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromId = dragId || e.dataTransfer.getData('text/plain');
              const next = moveItem(banners, fromId, b._id);
              setDragId(null);
              setOverId(null);
              if (next !== banners) persistOrder(next);
            }}
            onDragEnd={() => { setDragId(null); setOverId(null); }}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              dragId === b._id ? 'opacity-50 bg-slate-50' : overId === b._id ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <button
              type="button"
              aria-label="Drag to reorder"
              className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="Drag to change slider position"
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <span className="w-6 text-center text-[11px] font-black text-slate-400">{index + 1}</span>
            <img src={b.image} alt="" className="w-24 h-14 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-900 truncate">
                {b.title || b.titleLine2 ? (
                  <>
                    <span>{b.title}</span>
                    {b.titleLine2 ? <span className="text-ember"> {b.titleLine2}</span> : null}
                  </>
                ) : (
                  <span className="text-slate-400 italic">No title</span>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {b.linkType === 'car' ? `Links to: ${b.car?.title || 'a car'}` : b.linkType === 'url' ? `Links to: ${b.url}` : 'No link'}
              </p>
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
                {editing.image && !imageFile && <img src={editing.image} alt="" className="w-full h-28 object-cover rounded-lg" />}
              </>
            ) : (
              <>
                <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles([...e.target.files])} className="text-sm w-full" />
                <p className="text-xs text-slate-400">
                  {imageFiles.length > 1
                    ? `${imageFiles.length} images selected — one banner slide will be created per image, sharing the settings below.`
                    : 'Select multiple images to create several banner slides in one go.'}
                </p>
                {imageFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {imageFiles.map((f, i) => (
                      <img key={i} src={URL.createObjectURL(f)} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Heading line 1 (black)</label>
              <input placeholder="Your Trusted Partner In" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Heading line 2 (blue)</label>
              <input placeholder="Used Cars Dream" value={form.titleLine2} onChange={(e) => setForm({ ...form, titleLine2: e.target.value })} className={inputCls} />
            </div>
            <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} />
            <input placeholder="Button label (e.g. Browse cars)" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className={inputCls} />

            <select value={form.linkType} onChange={(e) => setForm({ ...form, linkType: e.target.value })} className={inputCls}>
              <option value="none">No link (promotional only)</option>
              <option value="car">Link to a specific car</option>
              <option value="url">Link to a URL / page</option>
            </select>

            {form.linkType === 'car' && (
              <select required value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} className={inputCls}>
                <option value="">Select a car</option>
                {cars.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            )}
            {form.linkType === 'url' && (
              <input required placeholder="/cars or https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputCls} />
            )}

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>

            <button className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-2.5 rounded-lg">
              {editing._id ? 'Save banner' : imageFiles.length > 1 ? `Create ${imageFiles.length} banner slides` : 'Save banner'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
