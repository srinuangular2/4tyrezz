import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from './DataTable';
import { formatPrice } from '../utils/format';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-verify-bg text-verify',
  rejected: 'bg-red-100 text-red-700',
  sold: 'bg-slate-200 text-slate-600',
};

export default function CarsManager({ defaultStatus = '' }) {
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState(defaultStatus);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [carToDelete, setCarToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (page = 1) => {
    const { data } = await api.get('/cars', {
      params: { status: status || undefined, search: search || undefined, page, limit: 8, sort: '-createdAt' },
    });
    setCars(data.cars);
    setMeta({ page: data.page, pages: data.pages });
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

  const toggleFlag = async (id, field) => {
    await api.patch(`/admin/cars/${id}/flag`, { field });
    toast.success('Car flag updated');
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
    { key: 'title', label: 'Car', render: (c) => <span className="font-medium text-slate-900">{c.title}</span> },
    { key: 'price', label: 'Price', render: (c) => formatPrice(c.price) },
    { key: 'seller', label: 'Seller', render: (c) => c.owner?.dealershipName || c.owner?.name || c.owner?.mobile || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (c) => (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md capitalize ${STATUS_COLORS[c.status]}`}>
          {c.status}
        </span>
      ),
    },
    {
      key: 'flags',
      label: 'Flags',
      render: (c) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => toggleFlag(c._id, 'isFeatured')}
            className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors ${c.isFeatured ? 'bg-ink text-white' : 'bg-slate-100 text-slate2 hover:bg-slate-200'}`}
          >
            Featured
          </button>
          <button
            onClick={() => toggleFlag(c._id, 'isPremium')}
            className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors ${c.isPremium ? 'bg-ember text-white' : 'bg-slate-100 text-slate2 hover:bg-slate-200'}`}
          >
            Premium
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Link to={`/cars/edit/${c._id}`} className="text-ink text-xs font-bold underline hover:text-slate-700">
            Edit
          </Link>
          {c.status !== 'approved' && (
            <button onClick={() => setCarStatus(c._id, 'approved')} className="text-verify text-xs font-bold hover:underline">
              Approve
            </button>
          )}
          {c.status !== 'rejected' && (
            <button onClick={() => setCarStatus(c._id, 'rejected')} className="text-red-600 text-xs font-bold hover:underline">
              Reject
            </button>
          )}
          {c.status !== 'sold' && (
            <button onClick={() => setCarStatus(c._id, 'sold')} className="text-slate2 text-xs font-bold hover:underline">
              Mark sold
            </button>
          )}
          <button
            onClick={() => setCarToDelete(c)}
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-xs font-bold transition-colors"
            title="Delete Car"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
          placeholder="Search by title…"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      <DataTable columns={columns} rows={cars} page={meta.page} pages={meta.pages} onPageChange={load} />

      {/* Styled Confirmation Modal */}
      {carToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all scale-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Delete Vehicle Listing</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{carToDelete.title}"</span>? This will permanently remove the listing from the database and cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCarToDelete(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Listing'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}