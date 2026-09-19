import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';
import { GlassCard, PageHeader, StatusBadge, btnGhost, btnPrimary, inputCls } from '../../components/dealer/ui';

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

  if (!cars) return <p className="text-sm font-semibold text-slate-400">Loading inventory…</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Showroom"
        title="Inventory management"
        subtitle="Price, publish and track every listing from this dashboard."
        actions={
          <div className="flex gap-2">
            <Link to="/dealer/dashboard/inventory/bulk" className={btnGhost}>Bulk CSV</Link>
            <Link to="/dealer/dashboard/inventory/add" className={btnPrimary}>Add vehicle</Link>
          </div>
        }
      />
      <GlassCard className="p-5">
        {selected.length > 0 && (
          <div className="mb-4 rounded-2xl border border-[#3083ff]/20 bg-[#EAF2FF] p-3 flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-[#1853ff]">{selected.length} selected</p>
            <input className={`${inputCls} w-24`} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Value" />
            <select className={inputCls} value={bulkMode} onChange={(e) => setBulkMode(e.target.value)}>
              <option value="percent">% adjust</option>
              <option value="amount">₹ adjust</option>
            </select>
            <button type="button" onClick={() => bulk('price')} className={btnGhost}>Apply price</button>
            <button type="button" onClick={() => bulk('unpublish')} className={btnGhost}>Unpublish</button>
            <button type="button" onClick={() => bulk('delete')} className="inline-flex items-center justify-center gap-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-bold px-4 py-2.5 rounded-xl">Delete</button>
          </div>
        )}

        {cars.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No vehicles in this showroom yet.</p>
            <Link to="/dealer/dashboard/inventory/add" className={btnPrimary}>List your first car</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3">
                    <input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? [] : allIds)} />
                  </th>
                  {['Car', 'Price', 'Status', 'Availability', 'Actions'].map((h) => (
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
                    <td className="px-3 py-3 text-slate-700">{formatPrice(c.price)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge value={status} />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className={`${inputCls} text-xs`}
                          value={c.availability || 'available'}
                          onChange={(e) => act(c._id, '/availability', { availability: e.target.value })}
                        >
                          {(meta.availability || ['available', 'reserved', 'in_transit', 'unavailable']).map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase">
                          <Link to={`/dealer/dashboard/inventory/edit/${c._id}`} className="text-[#3083ff]">Edit</Link>
                          <button type="button" onClick={() => { setPriceCar(c); setPrice(String(c.price || '')); }} className="text-slate-400">Price</button>
                          <button type="button" onClick={() => act(c._id, '/publish', { publish: !published })}>{published ? 'Unpublish' : 'Publish'}</button>
                          <button type="button" onClick={() => act(c._id, '/sold')} className="text-slate-700">Sold</button>
                          <button type="button" onClick={async () => {
                            try {
                              await api.delete(`/dealer/inventory/${c._id}`);
                              load();
                            } catch (e) {
                              toast.error(e.response?.data?.message || 'Could not delete');
                            }
                          }} className="text-rose-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {priceCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPriceCar(null)} aria-label="Close" />
          <div className="relative bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <button type="button" onClick={() => setPriceCar(null)} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full border border-slate-200 text-slate-500 font-black">✕</button>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff]">Quick price update</p>
            <h2 className="font-black text-lg mt-1 text-slate-900">{priceCar.title}</h2>
            <input className={`${inputCls} mt-4`} value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
            <button type="button" onClick={savePrice} className={`${btnPrimary} mt-3 w-full`}>Save price</button>
          </div>
        </div>
      )}
    </div>
  );
}
