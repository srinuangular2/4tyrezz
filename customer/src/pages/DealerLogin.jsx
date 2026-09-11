import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { dealerLogin } from '../app/authSlice';
import { emailError, inputClass } from '../lib/kycValidation';

export default function DealerLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const mailErr = emailError(form.email) || (!form.email ? 'Work email is required' : '');
    if (mailErr) {
      setFieldError(mailErr);
      return;
    }
    if (!form.password) {
      setFieldError('Password is required');
      return;
    }
    setLoading(true);
    const res = await dispatch(dealerLogin(form));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') {
      const verified = res.payload?.user?.kycVerified;
      navigate(verified ? '/dealer/dashboard/inventory' : '/dealer/dashboard/kyc');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 py-14 max-w-md">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#3083ff]">Dealer portal</p>
        <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight mt-2">Showroom sign in</h1>
        <p className="text-sm font-medium text-slate-500 mt-2 mb-8">
          Manage inventory, leads and KYC from one dashboard.
        </p>

        <form
          onSubmit={submit}
          autoComplete="off"
          className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_20px_40px_0_rgba(48,131,255,0.12)] p-7 space-y-4"
        >
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Work email</span>
            <input
              required
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setFieldError('');
              }}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setFieldError('');
              }}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          {(fieldError || error) && <p className="text-sm font-semibold text-rose-600">{fieldError || error}</p>}
          <button
            disabled={loading}
            className="w-full bg-[#3083ff] hover:bg-[#1853ff] text-white font-black py-3.5 rounded-2xl transition"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm font-semibold text-slate-500 text-center mt-6">
          New partner?{' '}
          <Link to="/dealer/onboarding" className="text-[#3083ff] font-black hover:underline">
            Register and complete KYC
          </Link>
        </p>
      </div>
    </div>
  );
}
