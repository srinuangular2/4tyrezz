import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { persistCustomerSession } from '../../app/authSlice';
import DevOtpHint from '../../components/DevOtpHint';
import {
  emailError,
  inputClass,
  mobileError,
  normalizeMobile,
  passwordError,
  passwordStrength,
} from '../../lib/kycValidation';
import AuthShell from './AuthShell';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '', otp: '', city: '' });

  useEffect(() => {
    api.get('/cities').then((r) => setCities(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => setCities([]));
  }, []);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const requestOtp = async () => {
    const err = mobileError(form.mobile) || (!form.mobile ? 'Mobile is required' : '');
    if (err) return setErrors((e) => ({ ...e, mobile: err }));
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { mobile: normalizeMobile(form.mobile), purpose: 'register' });
      setOtpSent(true);
      setDevOtp(data.devOtp || '');
      toast.success('OTP sent');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{4}$/.test(form.otp)) return setErrors((e) => ({ ...e, otp: 'Enter the 4-digit OTP' }));
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { mobile: normalizeMobile(form.mobile), otp: form.otp, purpose: 'register' });
      setToken(data.mobileVerifiedToken);
      toast.success('Mobile verified');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {
      name: form.name.trim() ? '' : 'Full name is required',
      email: emailError(form.email) || (!form.email ? 'Email is required' : ''),
      password: passwordError(form.password) || (!form.password ? 'Password is required' : ''),
      mobile: mobileError(form.mobile) || (!form.mobile ? 'Mobile is required' : ''),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    if (!token) return toast.error('Verify mobile OTP before creating the account');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        mobile: normalizeMobile(form.mobile),
        city: form.city,
        mobileVerifiedToken: token,
      });
      dispatch(persistCustomerSession(data));
      if (data.verifyEmailUrl) toast.success('Account created. Use the email verification link shown next.');
      else toast.success('Account created');
      navigate('/profile/settings', { replace: true, state: { verifyEmailUrl: data.verifyEmailUrl } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Verify your mobile with OTP, then set email and password.">
      <form onSubmit={submit} className="space-y-4" autoComplete="off">
        <Field label="Full name" error={errors.name}>
          <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className={inputClass} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className={inputClass} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
          {form.password && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full ${strength.score <= 1 ? 'bg-rose-500' : strength.score <= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${strength.percent}%` }} />
              </div>
              <p className="text-[11px] font-bold text-slate-500 mt-1">{strength.label}</p>
            </div>
          )}
        </Field>
        <Field label="Mobile" error={errors.mobile}>
          <div className="flex gap-2">
            <input className={inputClass} value={form.mobile} disabled={Boolean(token)} onChange={(e) => set('mobile', normalizeMobile(e.target.value))} />
            <button type="button" disabled={loading || Boolean(token)} onClick={requestOtp} className="shrink-0 px-4 rounded-2xl bg-slate-900 text-white text-xs font-black">Send OTP</button>
          </div>
        </Field>
        {otpSent && !token && (
          <Field label="OTP" error={errors.otp}>
            <div className="flex gap-2">
              <input className={inputClass} value={form.otp} onChange={(e) => set('otp', e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <button type="button" onClick={verifyOtp} className="shrink-0 px-4 rounded-2xl bg-[#3083ff] text-white text-xs font-black">Verify</button>
            </div>
            <DevOtpHint code={devOtp} mobile={form.mobile} />
          </Field>
        )}
        {token && <p className="text-xs font-bold text-emerald-600">Mobile verified</p>}
        <Field label="City">
          <select className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)}>
            <option value="">Select city</option>
            {cities.map((c) => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
        <button disabled={loading || !token} className="w-full bg-[#3083ff] text-white font-black rounded-2xl py-3.5 disabled:opacity-60">
          {loading ? 'Creating…' : 'Create account'}
        </button>
        <p className="text-center text-sm font-semibold text-slate-500">
          Already have an account? <Link to="/customer/login" className="text-[#3083ff] font-black">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? <span className="text-[11px] font-bold text-rose-600 mt-1 block">{error}</span> : null}
    </label>
  );
}
