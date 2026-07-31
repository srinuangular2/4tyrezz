import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { dealerLogin } from '../app/authSlice';

export default function DealerLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await dispatch(dealerLogin(form));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') navigate('/dashboard/inventory');
  };

  return (
    <div className="container-px py-16 max-w-sm mx-auto">
      <h1 className="font-display font-black text-3xl">Dealer Login</h1>
      <p className="text-slate2 text-sm mt-1 mb-6">Manage your inventory and leads on 4tyrezz.</p>
      <form onSubmit={submit} className="space-y-3">
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-3 rounded-lg">
          {loading ? 'Logging in…' : 'Login'}
        </button>
        <p className="text-xs text-slate-400 pt-2">Demo: dealer@4tyrezz.com / dealer123 (after running the seed script)</p>
      </form>
    </div>
  );
}
