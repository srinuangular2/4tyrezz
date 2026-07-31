import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '../app/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await dispatch(adminLogin(form));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') navigate('/');
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8">
        <span className="font-display font-black text-2xl">4tyrez<span className="text-ember">z</span></span>
        <p className="text-xs font-bold uppercase tracking-widest text-slate2 mt-1">Admin Portal</p>
        <form onSubmit={submit} className="space-y-3 mt-6">
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-3 rounded-lg">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-xs text-slate-400 pt-2">Demo: admin@4tyrezz.com / admin123 (after running the seed script)</p>
        </form>
      </div>
    </div>
  );
}
