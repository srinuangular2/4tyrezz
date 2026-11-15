import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';
import { BadgeCheck, Car, EyeOff, IndianRupee, Pencil, Percent, Radio } from 'lucide-react';
import { mediaUrl } from '../profile/hubUtils';
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
      <div className="flex items-end justify-between lg:hidden">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900">Stock</h1>
          <p className="text-[12px] text-slate-500">{cars.length} {cars.length === 1 ? 'car' : 'cars'}</p>
        </div>
        <Link to="/dealer/dashboard/inventory/bulk" className="text-[13px] font-semibold text-[#1853ff]">Bulk CSV</Link>
      </div>
      <div className="hidden lg:block">
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
      </div>
      <GlassCard className="p-5">
        {selected.length > 0 && (
          <div className="mb-4 rounded-2xl border border-[#3083ff]/20 bg-[#eaf2ff] p-3">
            <p className="text-[14px] font-medium text-[#1853ff]">{selected.length} {selected.length === 1 ? 'car' : 'cars'} selected</p>
            <p className="mt-1 text-[12px] font-normal text-slate-600">Change the price of these cars, or hide them from buyers.</p>
            <label className="mt-3 flex items-center gap-1.5 text-[12px] font-normal text-slate-500"><IndianRupee className="h-3.5 w-3.5 text-[#1853ff]" /> Amount</label>
            <input className={`${inputCls} mt-1`} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="For example 5 or 10000" />
            <label className="mt-3 flex items-center gap-1.5 text-[12px] font-normal text-slate-500"><Percent className="h-3.5 w-3.5 text-[#1853ff]" /> How to apply it</label>
            <select className={`${inputCls} mt-1`} value={bulkMode} onChange={(e) => setBulkMode(e.target.value)}>
              <option value="percent">Raise or lower by percent</option>
              <option value="amount">Raise or lower by rupees</option>
            </select>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => bulk('price')} className={btnPrimary}><IndianRupee className="h-4 w-4" /> Update price</button>
              <button type="button" onClick={() => bulk('unpublish')} className={btnGhost}><EyeOff className="h-4 w-4" /> Hide listings</button>
            </div>
            <button type="button" onClick={() => bulk('delete')} className="mt-2 w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-[13px] font-medium text-rose-600">Delete selected</button>
          </div>
        )}

        {cars.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No vehicles in this showroom yet.</p>
            <Link to="/dealer/dashboard/inventory/add" className={btnPrimary}>List your first car</Link>
          </div>
        ) : (
          <>
          <div className="space-y-3 lg:hidden">
            {cars.map((c) => {
              const status = c.listingStatus || c.status;
              const published = status === 'PUBLISHED' && !c.unpublished;
              const photo = mediaUrl(c.images?.[0]);
              return (
                <article key={c._id} className="overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-[#eaf2ff] to-white p-3">
                    <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} aria-label={`Select ${c.title}`} />
                    {photo ? (
                      <img src={photo} alt="" className="h-16 w-[72px] rounded-2xl object-cover" />
                    ) : (
                      <span className="flex h-16 w-[72px] items-center justify-center rounded-2xl bg-[#dbeafe] text-[#1853ff]">
                        <Car className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-slate-900">{c.title}</p>
                      <p className="mt-0.5 text-[13px] font-medium text-[#1853ff]">{formatPrice(c.price)}</p>
                      <div className="mt-1"><StatusBadge value={published ? 'Live' : status} /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 p-2 text-center text-[11px] font-medium">
                    <Link to={`/dealer/dashboard/inventory/edit/${c._id}`} className="flex flex-col items-center gap-0.5 rounded-xl bg-[#eaf2ff] py-2 text-[#1853ff]"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                    <button type="button" onClick={() => { setPriceCar(c); setPrice(String(c.price || '')); }} className="flex flex-col items-center gap-0.5 rounded-xl bg-[#fff4d6] py-2 text-[#9a6700]"><IndianRupee className="h-3.5 w-3.5" /> Price</button>
                    <button type="button" onClick={() => act(c._id, '/publish', { publish: !published })} className="flex flex-col items-center gap-0.5 rounded-xl bg-[#e7f8ef] py-2 text-[#0f7a45]">{published ? <EyeOff className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}{published ? 'Hide' : 'Live'}</button>
                    <button type="button" onClick={() => act(c._id, '/sold')} className="flex flex-col items-center gap-0.5 rounded-xl bg-[#f3e8ff] py-2 text-[#6d28d9]"><BadgeCheck className="h-3.5 w-3.5" /> Sold</button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto lg:block">
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
          </>
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
