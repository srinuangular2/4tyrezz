import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';

const STATUS_STYLE = {
  approved: 'bg-verify-bg text-verify', pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700', sold: 'bg-slate-200 text-slate-600',
};

export default function MyCars() {
  const [cars, setCars] = useState(null);

  const load = () => api.get('/cars/mine').then((r) => setCars(r.data)).catch(() => setCars([]));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/cars/${id}`);
    load();
  };

  if (!cars) return <p className="text-slate2 text-sm">Loading…</p>;
  if (cars.length === 0) return (
    <div className="text-center py-16">
      <p className="text-slate2 mb-4">You haven't listed any cars yet.</p>
      <Link to="/dashboard/add-car" className="bg-ember text-white font-semibold px-5 py-2.5 rounded-lg">List your first car</Link>
    </div>
  );

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate2">
          <tr>
            <th className="text-left px-4 py-3">Car</th><th className="text-left px-4 py-3">Price</th>
            <th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Views</th>
            <th className="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((c) => (
            <tr key={c._id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium">{c.title}</td>
              <td className="px-4 py-3">{formatPrice(c.price)}</td>
              <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-md capitalize ${STATUS_STYLE[c.status]}`}>{c.status}</span></td>
              <td className="px-4 py-3">{c.views}</td>
              <td className="px-4 py-3 space-x-3">
                <Link to={`/dashboard/edit-car/${c._id}`} className="text-ember font-semibold">Edit</Link>
                <button onClick={() => remove(c._id)} className="text-red-600 font-semibold">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
