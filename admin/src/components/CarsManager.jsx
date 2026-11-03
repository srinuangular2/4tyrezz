import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from './DataTable';
import { formatPrice } from '../utils/format';
import { Drawer, FilterPills } from './admin/ui';

const EXECUTIVE_FILTERS = [
  { value: 'all', label: 'All My Cars' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'rejected', label: 'Rejected' },
];

const PREMIUM_MIN = 1500000;

const STATUS_COLORS = {
  pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  unpublished: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  sold: 'bg-slate-800 text-slate-300',
};

function marketplaceStatus(c) {
  const listing = String(c.listingStatus || '').toUpperCase();
  if (c.status === 'sold' || listing === 'SOLD') return { label: 'Sold', key: 'sold' };
  if (c.status === 'rejected' || listing === 'REJECTED') return { label: 'Rejected', key: 'rejected' };
  if (c.status === 'pending' || listing === 'PENDING_MODERATION' || listing === 'DRAFT') {
    return { label: 'Pending', key: 'pending' };
  }
  if (c.unpublished || listing === 'UNPUBLISHED') return { label: 'Hidden', key: 'unpublished' };
  if (c.status === 'approved' || listing === 'PUBLISHED') return { label: 'Live', key: 'approved' };
  return { label: c.status || 'Draft', key: c.status || 'pending' };
}

function carImage(c) {
  const src = c.images?.[0];
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return src;
}

function approvalBadge(c) {
  const listing = String(c.listingStatus || '').toUpperCase();
  if (c.status === 'rejected' || listing === 'REJECTED') {
    return {
      label: 'Rejected',
      cls: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      reason: c.moderationNotes || 'Rejected by the main admin.',
    };
  }
  if (c.status === 'pending' || listing === 'PENDING_MODERATION' || listing === 'DRAFT') {
    return { label: 'Pending Approval', cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' };
  }
  return { label: 'Approved', cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' };
}

function inventoryBadge(c) {
  const listing = String(c.listingStatus || '').toUpperCase();
  if (c.status === 'sold' || listing === 'SOLD') {
    return { label: 'Sold', cls: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' };
  }
  return { label: 'Available', cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' };
}

function stockState(c) {
  const unavailable = c.status === 'sold' || c.unpublished || (c.availability && c.availability !== 'available');
  return unavailable
    ? { label: 'Unavailable', cls: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' }
    : { label: 'Available', cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' };
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

export default function CarsManager({ defaultStatus = '', liveOnly = false }) {
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState(defaultStatus);
  const [search, setSearch] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [availability, setAvailability] = useState('');
  const [dealers, setDealers] = useState([]);
  const [carToDelete, setCarToDelete] = useState(null);
  const [rejectReason, setRejectReason] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useSelector((state) => state.auth.user?.role);
  const isMainAdmin = role === 'admin';
  const isExecutive = role === 'executive_agent';
  const executiveFilter = EXECUTIVE_FILTERS.some((item) => item.value === (searchParams.get('filter') || searchParams.get('status')))
    ? (searchParams.get('filter') || searchParams.get('status'))
    : 'all';
  const [deleting, setDeleting] = useState(false);

  const load = async (page = 1) => {
    const { data } = await api.get('/cars', {
      params: {
        inventory: 1,
        listingCleared: liveOnly && !isExecutive ? 1 : undefined,
        status: isExecutive ? undefined : (status || undefined),
        filter: isExecutive && executiveFilter !== 'all' ? executiveFilter : undefined,
        owner: isExecutive ? undefined : (dealerId || undefined),
        availability: isExecutive ? undefined : (availability || undefined),
        search: search || undefined,
        page,
        limit: 10,
        sort: '-createdAt',
      },
    });
    setCars(data.cars);
    setMeta({ page: data.page, pages: data.pages, total: data.total || data.cars?.length || 0 });
  };

  useEffect(() => {
    load(1);
    /* eslint-disable-next-line */
  }, [status, dealerId, availability, executiveFilter, isExecutive]);

  useEffect(() => {
    if (!isMainAdmin) return;
    api.get('/admin/dealers', { params: { limit: 50 } })
      .then((res) => setDealers(res.data.data || []))
      .catch(() => setDealers([]));
  }, [isMainAdmin]);

  const setCarStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/cars/${id}/status`, { status: newStatus });
      toast.success(`Car status updated to ${newStatus}`);
      load(meta.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update listing');
    }
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
    {
      key: 'seller',
      label: 'Dealer',
      render: (c) => (
        <div>
          <p className="font-semibold text-white">{c.owner?.dealershipName || c.owner?.name || '—'}</p>
          <p className="text-[11px] text-slate-400">
            {c.owner?.role === 'executive_agent' ? 'Executive agent' : c.owner?.role === 'field_agent' ? 'Field agent' : (c.upload_address || c.car_location || c.location?.city || '')}
          </p>
        </div>
      ),
    },
    {
      key: 'availability',
      label: isExecutive ? 'Stock' : 'Availability',
      render: (c) => {
        const stock = isExecutive ? inventoryBadge(c) : stockState(c);
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${stock.cls}`}>{stock.label}</span>;
      },
    },
    {
      key: 'status',
      label: isExecutive ? 'Approval' : 'Status',
      render: (c) => {
        if (isExecutive) {
          const badge = approvalBadge(c);
          return (
            <div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${badge.cls}`}>{badge.label}</span>
              {badge.reason && (
                <button
                  type="button"
                  onClick={() => setRejectReason({ title: c.title, reason: badge.reason })}
                  className="block mt-1 text-[10px] font-bold text-rose-300 hover:underline"
                >
                  View reason
                </button>
              )}
            </div>
          );
        }
        const next = marketplaceStatus(c);
        return (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md capitalize ${STATUS_COLORS[next.key] || 'bg-slate-100'}`}>
            {next.label}
          </span>
        );
      },
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
      render: (c) => !isMainAdmin ? <span className="text-[11px] text-slate-500">View only</span> : (
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to={`/cars/edit/${c._id}`} className="text-[#3083ff] text-xs font-bold hover:underline">
            Edit
          </Link>
          {!c.listingCleared && c.status !== 'rejected' && c.status !== 'sold' ? (
            <Link to="/listings/moderation" className="text-amber-300 text-xs font-bold hover:underline">
              Inspect & approve
            </Link>
          ) : (c.unpublished || c.listingStatus === 'UNPUBLISHED') && c.status === 'approved' ? (
            <button onClick={() => setCarStatus(c._id, 'approved')} className="text-emerald-600 text-xs font-bold hover:underline">
              Publish
            </button>
          ) : null}
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
      {isExecutive && (
        <FilterPills
          value={executiveFilter}
          onChange={(value) => {
            const next = new URLSearchParams(searchParams);
            next.delete('status');
            if (value === 'all') next.delete('filter');
            else next.set('filter', value);
            setSearchParams(next, { replace: true });
          }}
          options={EXECUTIVE_FILTERS}
        />
      )}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search title, brand, city…"
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm w-64 text-slate-100 outline-none focus:border-blue-500/50"
        />
        {isMainAdmin && (
          <select
            value={dealerId}
            onChange={(e) => setDealerId(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="">All dealers</option>
            {dealers.map((dealer) => (
              <option key={dealer.user?._id || dealer._id} value={dealer.user?._id || ''}>
                {dealer.businessName || dealer.user?.dealershipName || dealer.user?.name || 'Dealer'}
              </option>
            ))}
          </select>
        )}
        {!isExecutive && (
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="">Available and unavailable</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        )}
        {!isExecutive && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="">{liveOnly ? 'Published' : 'All statuses'}</option>
            {!liveOnly && <option value="pending">Pending</option>}
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sold">Sold</option>
          </select>
        )}
        <span className="text-xs font-semibold text-slate-400">{meta.total} listings</span>
      </div>

      <DataTable columns={columns} rows={cars} page={meta.page} pages={meta.pages} onPageChange={load} />

      {carToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <button type="button" onClick={() => setCarToDelete(null)} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full border border-slate-700 text-slate-400 font-black">✕</button>
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

      {rejectReason && (
        <Drawer title="Rejection reason" onClose={() => setRejectReason(null)}>
          <p className="text-sm font-semibold text-white">{rejectReason.title}</p>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">{rejectReason.reason}</p>
        </Drawer>
      )}
    </div>
  );
}
