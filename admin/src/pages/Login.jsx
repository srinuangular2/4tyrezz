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
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl w-full max-w-sm p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
        <span className="font-display font-black text-2xl text-white">4TYRE<span className="text-blue-500">ZZ</span></span>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Admin Portal</p>
        <form onSubmit={submit} className="space-y-3 mt-6">
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60" />
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
