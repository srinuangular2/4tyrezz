import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { updateProfile } from '../../app/authSlice';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    dealershipName: user?.dealershipName || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      city: user?.city || '',
      dealershipName: user?.dealershipName || '',
      email: user?.email || '',
    });
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await dispatch(updateProfile(form));
    setSaving(false);
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Profile updated');
    } else {
      toast.error(res.payload || 'Could not save profile');
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-100 rounded-2xl p-6 max-w-md space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate2 mb-1 block">Full name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-ember outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate2 mb-1 block">Mobile number</label>
        <input
          disabled
          value={user?.mobile ? `+91 ${user.mobile}` : '—'}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate2"
        />
      </div>
      {user?.role === 'customer' && (
        <div>
          <label className="text-xs font-semibold text-slate2 mb-1 block">Email {user?.googleConnected && '(Google linked)'}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@gmail.com"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-ember outline-none"
          />
        </div>
      )}
      {user?.role === 'dealer' && (
        <>
          <div>
            <label className="text-xs font-semibold text-slate2 mb-1 block">Email</label>
            <input disabled value={user?.email || '—'} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate2" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate2 mb-1 block">Dealership name</label>
            <input
              value={form.dealershipName}
              onChange={(e) => setForm({ ...form, dealershipName: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-ember outline-none"
            />
          </div>
        </>
      )}
      <div>
        <label className="text-xs font-semibold text-slate2 mb-1 block">City</label>
        <input
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-ember outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-ember hover:bg-ember-dark disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
