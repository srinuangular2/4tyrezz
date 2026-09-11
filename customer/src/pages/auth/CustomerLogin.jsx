import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { customerLogin } from '../../app/authSlice';
import { emailError, inputClass, passwordError } from '../../lib/kycValidation';
import AuthShell from './AuthShell';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const redirectTo = location.state?.from || '/profile/settings';

  const submit = async (e) => {
    e.preventDefault();
    const next = {
      email: emailError(form.email) || (!form.email ? 'Email is required' : ''),
      password: passwordError(form.password) || (!form.password ? 'Password is required' : ''),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setLoading(true);
    const res = await dispatch(customerLogin(form));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') {
      if (res.payload.user?.role === 'dealer') return navigate('/dealer/dashboard', { replace: true });
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(res.payload || 'Login failed');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in with the email and password you registered.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Email</span>
          <input className={`${inputClass} mt-1.5`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <span className="text-[11px] font-bold text-rose-600">{errors.email}</span>}
        </label>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Password</span>
          <input className={`${inputClass} mt-1.5`} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {errors.password && <span className="text-[11px] font-bold text-rose-600">{errors.password}</span>}
        </label>
        <button disabled={loading} className="w-full bg-[#3083ff] text-white font-black rounded-2xl py-3.5">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled className="border border-slate-200 rounded-2xl py-2.5 text-xs font-black text-slate-400">Google</button>
          <button type="button" disabled className="border border-slate-200 rounded-2xl py-2.5 text-xs font-black text-slate-400">Apple</button>
        </div>
        <p className="text-[11px] font-semibold text-slate-400 text-center">Social login activates when OAuth credentials are configured.</p>
        <p className="text-center text-sm font-semibold text-slate-500">
          <Link to="/customer/forgot-password" className="text-[#3083ff] font-black">Forgot password</Link>
          {' · '}
          <Link to="/login" className="text-[#3083ff] font-black">OTP login</Link>
          {' · '}
          <Link to="/customer/register" className="text-[#3083ff] font-black">Create account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
