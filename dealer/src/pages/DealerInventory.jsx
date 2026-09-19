import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { formatPrice } from '../utils/format';
import { ProfileCard } from '../components/ui';

const STATUS_STYLE = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700',
  PENDING_MODERATION: 'bg-amber-50 text-amber-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  UNPUBLISHED: 'bg-slate-100 text-slate-600',
  REJECTED: 'bg-rose-50 text-rose-700',
  SOLD: 'bg-slate-800 text-white',
  approved: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-rose-50 text-rose-700',
  sold: 'bg-slate-800 text-white',
};

export default function DealerInventory() {
  const [cars, setCars] = useState(null);
  const [selected, setSelected] = useState([]);
  const [priceCar, setPriceCar] = useState(null);
  const [price, setPrice] = useState('');
  const [bulkMode, setBulkMode] = useState('percent');
  const [bulkValue, setBulkValue] = useState('');
  const [meta, setMeta] = useState({ availability: [] });

  const load = () => {
    api.get('/dealer/inventory').then((r) => setCars(r.data.data || [])).catch(() => setCars([]));
  };
  useEffect(() => {
    load();
    api.get('/meta/statuses').then((r) => setMeta(r.data || {})).catch(() => {});
  }, []);

  const allIds = useMemo(() => (cars || []).map((c) => c._id), [cars]);
  const allChecked = selected.length > 0 && selected.length === allIds.length;

  const toggle = (id) => {
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const act = async (id, path, body = {}) => {
    try {
      await api.patch(`/dealer/inventory/${id}${path}`, body);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  const bulk = async (action) => {
    if (!selected.length) return toast.error('Select listings first');
    try {
      await api.patch('/dealer/inventory/bulk', {
        ids: selected,
        action,
        mode: bulkMode,
        value: Number(bulkValue),
      });
      toast.success('Bulk update applied');
      setSelected([]);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Bulk action failed');
    }
  };

  const savePrice = async () => {
    if (!priceCar) return;
    try {
      await api.patch(`/dealer/inventory/${priceCar._id}/price`, { price: Number(price) });
      toast.success('Price updated');
      setPriceCar(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update price');
    }
  };

  if (!cars) return <p className="text-sm font-semibold text-slate-500">Loading inventory…</p>;

  return (
    <ProfileCard
      eyebrow="Showroom"
      title="Inventory management"
      action={
        <div className="flex gap-2">
          <Link to="/dealer/dashboard/inventory/bulk" className="border border-slate-200 font-black text-[11px] uppercase tracking-wider rounded-xl px-4 py-2.5">Bulk CSV</Link>
          <Link to="/dealer/dashboard/inventory/add" className="bg-[#3083ff] text-white font-black text-[11px] uppercase tracking-wider rounded-xl px-4 py-2.5">Add vehicle</Link>
        </div>
      }
    >
      {selected.length > 0 && (
        <div className="mb-4 rounded-2xl border border-[#3083ff]/20 bg-[#3083ff]/5 p-3 flex flex-wrap items-center gap-2">
          <p className="text-xs font-black uppercase tracking-wider text-[#3083ff]">{selected.length} selected</p>
          <input className="border rounded-lg px-2 py-1 text-sm w-24" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Value" />
          <select className="border rounded-lg px-2 py-1 text-sm" value={bulkMode} onChange={(e) => setBulkMode(e.target.value)}>
            <option value="percent">% adjust</option>
            <option value="amount">₹ adjust</option>
          </select>
          <button type="button" onClick={() => bulk('price')} className="text-xs font-black uppercase bg-white border rounded-lg px-3 py-1.5">Apply price</button>
          <button type="button" onClick={() => bulk('unpublish')} className="text-xs font-black uppercase bg-white border rounded-lg px-3 py-1.5">Unpublish</button>
          <button type="button" onClick={() => bulk('delete')} className="text-xs font-black uppercase bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-3 py-1.5">Delete</button>
        </div>
      )}

      {cars.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">No vehicles in this showroom yet.</p>
          <Link to="/dealer/dashboard/inventory/add" className="bg-[#3083ff] text-white font-semibold px-5 py-2.5 rounded-lg">List your first car</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3">
                  <input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? [] : allIds)} />
                </th>
                {['Car', 'Price', 'Status', 'Availability', 'Views', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cars.map((c) => {
                const status = c.listingStatus || c.status;
                const published = status === 'PUBLISHED' && !c.unpublished;
                return (
                  <tr key={c._id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{c.title}</td>
                    <td className="px-3 py-3">{formatPrice(c.price)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>{status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="border rounded-lg px-2 py-1 text-xs font-bold"
                        value={c.availability || 'available'}
                        onChange={(e) => act(c._id, '/availability', { availability: e.target.value })}
                      >
                        {(meta.availability || ['available', 'reserved', 'in_transit', 'unavailable']).map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">{c.views || 0}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase">
                        <Link to={`/dealer/dashboard/inventory/edit/${c._id}`} className="text-[#3083ff]">Edit</Link>
                        <button type="button" onClick={() => { setPriceCar(c); setPrice(String(c.price || '')); }} className="text-slate-600">Price</button>
                        <button type="button" onClick={() => act(c._id, '/publish', { publish: !published })}>{published ? 'Unpublish' : 'Publish'}</button>
                        <button type="button" onClick={() => act(c._id, '/sold')} className="text-slate-900">Sold</button>
                        <button type="button" onClick={async () => {
                          try {
                            await api.delete(`/dealer/inventory/${c._id}`);
                            load();
                          } catch (e) {
                            toast.error(e.response?.data?.message || 'Could not delete');
                          }
                        }} className="text-rose-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {priceCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={() => setPriceCar(null)} aria-label="Close" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <button type="button" onClick={() => setPriceCar(null)} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full border border-slate-200 text-slate-500 font-black">✕</button>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff]">Quick price update</p>
            <h2 className="font-black text-lg mt-1">{priceCar.title}</h2>
            <input className="mt-4 w-full border rounded-xl px-3 py-2.5" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
            <button type="button" onClick={savePrice} className="mt-3 w-full bg-[#3083ff] text-white font-black rounded-xl py-2.5">Save price</button>
          </div>
        </div>
      )}
    </ProfileCard>
  );
}
