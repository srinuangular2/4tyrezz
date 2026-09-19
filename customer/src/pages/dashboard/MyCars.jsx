import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';

const STATUS_STYLE = {
  approved: 'bg-verify-bg text-verify',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  sold: 'bg-slate-200 text-slate-600',
};

export default function MyCars() {
  const [cars, setCars] = useState(null);

  // Delete Modal & Loading State
  const [carToDelete, setCarToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get('/cars/mine').then((r) => setCars(r.data)).catch(() => setCars([]));
  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!carToDelete) return;
    setDeleting(true);
    const loadingToast = toast.loading(`Deleting ${carToDelete.title}...`);

    try {
      await api.delete(`/cars/${carToDelete._id}`);
      toast.success(`${carToDelete.title} deleted successfully!`, { id: loadingToast });
      setCarToDelete(null);
      load();
    } catch (err) {
      console.error('Failed to delete car:', err);
      toast.error(err.response?.data?.message || 'Failed to delete listing', { id: loadingToast });
    } finally {
      setDeleting(false);
    }
  };

  if (!cars) return <p className="text-slate2 text-sm">Loading…</p>;
  if (cars.length === 0) return (
    <div className="text-center py-16">
      <p className="text-slate2 mb-4">You haven't listed any cars yet.</p>
      <Link to="/dealer/dashboard/add-car" className="bg-ember text-white font-semibold px-5 py-2.5 rounded-lg">List your first car</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate2">
            <tr>
              <th className="text-left px-4 py-3">Car</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Views</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((c) => (
              <tr key={c._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{c.title}</td>
                <td className="px-4 py-3">{formatPrice(c.price)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md capitalize ${STATUS_STYLE[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">{c.views}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/dealer/dashboard/edit-car/${c._id}`} className="text-ember font-semibold text-xs hover:underline">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCarToDelete(c)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-xs font-bold transition-colors"
                      title="Delete Listing"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Styled Confirmation Modal */}
      {carToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all scale-100">
            <button type="button" onClick={() => setCarToDelete(null)} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full border border-slate-200 text-slate-500 font-black">✕</button>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Delete Vehicle Listing</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{carToDelete.title}"</span>? This action cannot be undone and will permanently remove your listing.
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