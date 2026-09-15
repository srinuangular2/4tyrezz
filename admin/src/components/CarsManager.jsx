import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from './DataTable';
import { formatPrice } from '../utils/format';

const PREMIUM_MIN = 1500000;

const STATUS_COLORS = {
  pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  sold: 'bg-slate-800 text-slate-300',
};

function carImage(c) {
  const src = c.images?.[0];
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return src;
}

function priceTone(c) {
  const ask = Number(c.price);
  const min = Number(c.quickInsights?.marketPriceMin);
  const max = Number(c.quickInsights?.marketPriceMax);
  if (!ask || !min || !max) return null;
  if (ask < min) return { label: 'Great', cls: 'bg-emerald-50 text-emerald-700' };
  if (ask <= max) return { label: 'Fair', cls: 'bg-[#EAF2FF] text-[#1853ff]' };
  return { label: 'High', cls: 'bg-amber-50 text-amber-700' };
}

export default function CarsManager({ defaultStatus = '' }) {
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState(defaultStatus);
  const [search, setSearch] = useState('');
  const [carToDelete, setCarToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (page = 1) => {
    const { data } = await api.get('/cars', {
      params: { status: status || undefined, search: search || undefined, page, limit: 10, sort: '-createdAt' },
    });
    setCars(data.cars);
    setMeta({ page: data.page, pages: data.pages, total: data.total || data.cars?.length || 0 });
  };

  useEffect(() => {
    load(1);
    /* eslint-disable-next-line */
  }, [status]);

  const setCarStatus = async (id, newStatus) => {
    await api.patch(`/admin/cars/${id}/status`, { status: newStatus });
    toast.success(`Car status updated to ${newStatus}`);
    load(meta.page);
  };


  const confirmDelete = async () => {
    if (!carToDelete) return;
    setDeleting(true);
    const loadingToast = toast.loading(`Deleting ${carToDelete.title}...`);

    try {
      await api.delete(`/cars/${carToDelete._id}`);
      toast.success(`${carToDelete.title} deleted successfully!`, { id: loadingToast });
      setCarToDelete(null);
      load(meta.page);
    } catch (err) {
      console.error('Failed to delete car:', err);
      toast.error(err.response?.data?.message || 'Failed to delete listing', { id: loadingToast });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Vehicle',
      render: (c) => {
        const img = carImage(c);
        return (
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{c.title}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {c.year || '—'} · {c.kmDriven ? `${Number(c.kmDriven).toLocaleString('en-IN')} km` : '—'} · {c.ownership || 1} owner
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      label: 'Ask vs market',
      render: (c) => {
        const tone = priceTone(c);
        const min = c.quickInsights?.marketPriceMin;
        const max = c.quickInsights?.marketPriceMax;
        return (
          <div>
            <p className="font-bold text-white">{formatPrice(c.price)}</p>
            <p className="text-[11px] font-medium text-slate-400">
              {min && max ? `Band ${formatPrice(min)} – ${formatPrice(max)}` : 'No band yet'}
            </p>
            {tone && (
              <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${tone.cls}`}>
                {tone.label}
              </span>
            )}
          </div>
        );
      },
    },
    { key: 'seller', label: 'Seller', render: (c) => c.owner?.dealershipName || c.owner?.name || c.owner?.mobile || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (c) => (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md capitalize ${STATUS_COLORS[c.status] || 'bg-slate-100'}`}>
          {c.status}
        </span>
      ),
    },
    {
      key: 'flags',
      label: 'Premium',
      render: (c) => (
        // Customer "Premium" = ask price ≥ ₹15 Lakh. isPremium remains a dealer boost flag (not shown here).
        Number(c.price) >= PREMIUM_MIN ? (
          <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-blue-500 text-white">Premium</span>
        ) : (
          <span className="text-[11px] font-medium text-slate-500">—</span>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to={`/cars/edit/${c._id}`} className="text-[#3083ff] text-xs font-bold hover:underline">
            Edit
          </Link>
          {c.status !== 'approved' && (
            <button onClick={() => setCarStatus(c._id, 'approved')} className="text-emerald-600 text-xs font-bold hover:underline">
              Approve
            </button>
          )}
          {c.status !== 'rejected' && (
            <button onClick={() => setCarStatus(c._id, 'rejected')} className="text-rose-600 text-xs font-bold hover:underline">
              Reject
            </button>
          )}
          {c.status !== 'sold' && (
            <button onClick={() => setCarStatus(c._id, 'sold')} className="text-slate-500 text-xs font-bold hover:underline">
              Sold
            </button>
          )}
          <button
            onClick={() => setCarToDelete(c)}
            className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-md text-xs font-bold transition-colors"
            title="Delete Car"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search title, brand, city…"
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm w-64 text-slate-100 outline-none focus:border-blue-500/50"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="sold">Sold</option>
        </select>
        <span className="text-xs font-semibold text-slate-400">{meta.total} listings</span>
      </div>

      <DataTable columns={columns} rows={cars} page={meta.page} pages={meta.pages} onPageChange={load} />

      {carToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white">Delete vehicle listing</h3>
            <p className="text-sm text-slate-400 leading-relaxed mt-2">
              Delete <span className="font-semibold text-white">"{carToDelete.title}"</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCarToDelete(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
