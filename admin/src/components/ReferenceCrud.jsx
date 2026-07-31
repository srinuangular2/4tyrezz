import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from './Modal';

// One generic add/edit/delete list, reused for Brands, Models, and Cities —
// they're structurally identical (a name + a couple of optional fields).
export default function ReferenceCrud({ title, endpoint, fields, extraQuery = {} }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [form, setForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);

  const load = () => api.get(`/${endpoint}`, { params: extraQuery }).then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openNew = () => { setForm({}); setEditing({}); };
  const openEdit = (item) => { setForm(item); setEditing(item); };

  const save = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v != null && typeof v !== 'object') data.append(k, v); });
    if (logoFile) data.append('logo', logoFile);

    if (editing._id) await api.put(`/${endpoint}/${editing._id}`, data);
    else await api.post(`/${endpoint}`, data);
    setEditing(null); setLogoFile(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`/${endpoint}/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display font-black text-2xl">{title}</h1>
        <button onClick={openNew} className="bg-ember hover:bg-ember-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add {title.slice(0, -1) || title}</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {items.length === 0 && <p className="text-slate2 text-sm p-6">No records yet.</p>}
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              {item.logo && <img src={item.logo} className="w-8 h-8 rounded object-cover" />}
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                {item.brand?.name && <p className="text-xs text-slate2">{item.brand.name}</p>}
                {item.state && <p className="text-xs text-slate2">{item.state}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => openEdit(item)} className="text-ember text-xs font-bold">Edit</button>
              <button onClick={() => remove(item._id)} className="text-red-600 text-xs font-bold">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing._id ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-3">
            {fields.map((f) => (
              f.type === 'select' ? (
                <select key={f.name} required={f.required} value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">{f.placeholder}</option>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'file' ? (
                <input key={f.name} type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="text-sm" />
              ) : (
                <input key={f.name} required={f.required} placeholder={f.placeholder} value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              )
            ))}
            <button className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-2.5 rounded-lg">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
