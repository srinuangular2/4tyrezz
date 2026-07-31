import { useState } from 'react';
import { useSelector } from 'react-redux';

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: user?.name || '', city: user?.city || '', dealershipName: user?.dealershipName || '' });
  const [saved, setSaved] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // Wire this to PUT /api/users/me once that endpoint exists — kept local for the MVP.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-100 rounded-2xl p-6 max-w-md space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate2 mb-1 block">Full name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate2 mb-1 block">{user?.role === 'dealer' ? 'Email' : 'Mobile number'}</label>
        <input disabled value={user?.role === 'dealer' ? user?.email : user?.mobile} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate2" />
      </div>
      {user?.role === 'dealer' && (
        <div>
          <label className="text-xs font-semibold text-slate2 mb-1 block">Dealership name</label>
          <input value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
        </div>
      )}
      <div>
        <label className="text-xs font-semibold text-slate2 mb-1 block">City</label>
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
      </div>
      <button className="bg-ember hover:bg-ember-dark text-white font-semibold px-5 py-2.5 rounded-lg">Save changes</button>
      {saved && <p className="text-verify text-sm font-semibold">Saved!</p>}
    </form>
  );
}
