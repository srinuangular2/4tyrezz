import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { dealerLogin, fetchMe } from '../app/authSlice';
import PasswordField from '../components/PasswordField';
import { inputClass } from '../lib/kycValidation';

function formatDealerId(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '');
}

export default function DealerLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ dealerCode: '', password: '' });
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const dealerCode = formatDealerId(form.dealerCode);
    if (!dealerCode) {
      setFieldError('Dealer ID is required');
      return;
    }
    if (!form.password) {
      setFieldError('Password is required');
      return;
    }
    setLoading(true);
    const res = await dispatch(dealerLogin({
      dealerCode,
      password: form.password,
    }));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') {
      await dispatch(fetchMe());
      const verified = res.payload?.user?.kycVerified;
      navigate(verified ? '/dealer/dashboard/inventory' : '/dealer/dashboard/onboarding');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl w-full max-w-sm p-8 shadow-[0_20px_40px_0_rgba(48,131,255,0.12)]">
        <span className="font-display font-black text-2xl text-slate-900">4TYRE<span className="text-[#3083ff]">ZZ</span></span>
        <p className="text-xs font-bold uppercase tracking-widest text-[#3083ff] mt-1">Dealer portal</p>
        <p className="text-sm text-slate-500 mt-3">
          Use the Dealer ID issued by 4tyrezz. Complete KYC, then add cars for admin approval.
        </p>
        <form onSubmit={submit} autoComplete="off" className="space-y-3 mt-6">
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Dealer ID</span>
            <input
              required
              type="text"
              autoComplete="username"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={form.dealerCode}
              onChange={(e) => {
                setForm({ ...form, dealerCode: formatDealerId(e.target.value) });
                setFieldError('');
              }}
              placeholder="4T-2026-52613"
              className={`${inputClass} mt-1.5 uppercase tracking-wide`}
            />
          </label>
          <PasswordField
            required
            label="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              setFieldError('');
            }}
          />
          {(fieldError || error) && <p className="text-sm font-semibold text-rose-600">{fieldError || error}</p>}
          <button
            disabled={loading}
            className="w-full bg-[#3083ff] hover:bg-[#1853ff] text-white font-semibold py-3.5 rounded-2xl"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm font-semibold text-slate-500 text-center mt-6">
          Need an account? Ask 4tyrezz admin to create your Dealer ID.
        </p>
        <p className="text-sm font-semibold text-slate-500 text-center mt-2">
          Already signed in?{' '}
          <Link to="/dealer/dashboard/onboarding" className="text-[#3083ff] font-black hover:underline">
            Continue KYC
          </Link>
        </p>
      </div>
    </div>
  );
}
