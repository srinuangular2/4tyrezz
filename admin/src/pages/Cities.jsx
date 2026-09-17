import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal'; // Correct path from src/pages/

export default function Cities() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', state: '', areasInput: '' });

  const load = async () => {
    try {
      const res = await api.get('/cities');
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load cities:', err);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm({ name: '', state: '', areasInput: '' });
    setEditing({});
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      state: item.state || '',
      areasInput: Array.isArray(item.areas) ? item.areas.join(', ') : '',
    });
    setEditing(item);
  };

  const save = async (e) => {
    e.preventDefault();

    const areasArray = form.areasInput
      ? form.areasInput.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    const payload = {
      name: form.name,
      state: form.state,
      areas: areasArray,
    };

    try {
      if (editing._id) {
        await api.put(`/cities/${editing._id}`, payload);
      } else {
        await api.post('/cities', payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      console.error('Failed to save city:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Server error saving city');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this city?')) return;
    try {
      await api.delete(`/cities/${id}`);
      load();
    } catch (err) {
      console.error('Failed to delete city:', err);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display font-black text-2xl">Cities</h1>
        <button
          onClick={openNew}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Add City
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
        {items.length === 0 && (
          <p className="text-slate-400 text-sm p-6">No records yet.</p>
        )}
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-bold text-sm text-slate-900">{item.name}</p>
              {item.state && <p className="text-xs text-slate-500">{item.state}</p>}
              {item.areas && item.areas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.areas.map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => openEdit(item)}
                className="text-red-600 text-xs font-bold hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => remove(item._id)}
                className="text-slate-500 text-xs font-bold hover:text-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing._id ? 'Edit City' : 'Add City'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                City Name
              </label>
              <input
                required
                placeholder="e.g. Hyderabad"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                State
              </label>
              <input
                placeholder="e.g. Telangana"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Areas / Localities (Comma-separated)
              </label>
              <textarea
                placeholder="Hitech City, Gachibowli, Kukatpally, Jubilee Hills, Madhapur"
                value={form.areasInput}
                onChange={(e) => setForm({ ...form, areasInput: e.target.value })}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition"
            >
              Save
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}