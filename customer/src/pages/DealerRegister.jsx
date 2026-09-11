import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { persistDealerSession } from '../app/authSlice';
import DevOtpHint from '../components/DevOtpHint';
import {
  emailError,
  gstinError,
  inputClass,
  mobileError,
  normalizeGstin,
  normalizeMobile,
  normalizePan,
  panError,
  passwordError,
} from '../lib/kycValidation';

const BLANK = {
  name: '',
  email: '',
  password: '',
  mobile: '',
  dealershipName: '',
  city: '',
  gstNumber: '',
  panNumber: '',
  businessType: '',
  otp: '',
};

export default function DealerRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [mobileToken, setMobileToken] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const live = useMemo(
    () => ({
      email: emailError(form.email),
      mobile: mobileError(form.mobile),
      password: passwordError(form.password),
      panNumber: panError(form.panNumber),
      gstNumber: gstinError(form.gstNumber, form.panNumber),
    }),
    [form]
  );

  const requestOtp = async () => {
    const err = mobileError(form.mobile) || (!form.mobile ? 'Mobile number is required' : '');
    if (err) {
      setErrors((e) => ({ ...e, mobile: err }));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/dealer/otp/request', { mobile: normalizeMobile(form.mobile) });
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
    if (!/^\d{4}$/.test(form.otp)) {
      setErrors((e) => ({ ...e, otp: 'Enter the 4-digit OTP' }));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/dealer/otp/verify', { mobile: normalizeMobile(form.mobile), otp: form.otp });
      setMobileToken(data.mobileVerifiedToken);
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
      name: form.name.trim() ? '' : 'Contact person is required',
      dealershipName: form.dealershipName.trim() ? '' : 'Dealership name is required',
      email: emailError(form.email) || (!form.email ? 'Work email is required' : ''),
      password: passwordError(form.password) || (!form.password ? 'Password is required' : ''),
      mobile: mobileError(form.mobile) || (!form.mobile ? 'Mobile is required' : ''),
      panNumber: form.panNumber ? panError(form.panNumber) : '',
      gstNumber: form.gstNumber ? gstinError(form.gstNumber, form.panNumber) : '',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    if (!mobileToken) {
      toast.error('Verify mobile OTP before creating the account');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register-dealer', {
        ...form,
        email: form.email.trim().toLowerCase(),
        mobile: normalizeMobile(form.mobile),
        panNumber: form.panNumber ? normalizePan(form.panNumber) : '',
        gstNumber: form.gstNumber ? normalizeGstin(form.gstNumber) : '',
        mobileVerifiedToken: mobileToken,
      });
      dispatch(persistDealerSession(data));
      toast.success('Account created. Complete KYC to unlock inventory.');
      navigate('/dealer/dashboard/kyc');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  const verified = Boolean(mobileToken);

  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#3083ff]">Partner onboarding</p>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
          Register your showroom
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl leading-relaxed">
          Verify your mobile with OTP, then create the dealer account. GST, PAN and documents are checked on the KYC screen. Inventory stays locked until operations sets kycVerified.
        </p>

        <form onSubmit={submit} className="mt-8 bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_20px_40px_0_rgba(48,131,255,0.12)] p-6 sm:p-8 grid sm:grid-cols-2 gap-4" autoComplete="off">
          <Field label="Mobile" error={errors.mobile || live.mobile} span>
            <div className="flex gap-2">
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="off"
                value={form.mobile}
                disabled={verified}
                onChange={(e) => set('mobile', normalizeMobile(e.target.value))}
              />
              <button type="button" disabled={loading || verified} onClick={requestOtp} className="shrink-0 px-4 rounded-2xl bg-slate-900 text-white text-xs font-black">
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </Field>
          {otpSent && !verified && (
            <Field label="OTP" error={errors.otp} span>
              <div className="flex gap-2">
                <input className={inputClass} inputMode="numeric" value={form.otp} onChange={(e) => set('otp', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                <button type="button" disabled={loading} onClick={verifyOtp} className="shrink-0 px-4 rounded-2xl bg-[#3083ff] text-white text-xs font-black">
                  Verify
                </button>
              </div>
              <DevOtpHint code={devOtp} mobile={form.mobile} />
            </Field>
          )}
          {verified && <p className="sm:col-span-2 text-xs font-bold text-emerald-600">Mobile verified</p>}

          <Field label="Contact person" error={errors.name}>
            <input required className={inputClass} autoComplete="off" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Dealership name" error={errors.dealershipName}>
            <input required className={inputClass} autoComplete="off" value={form.dealershipName} onChange={(e) => set('dealershipName', e.target.value)} />
          </Field>
          <Field label="Work email" error={errors.email || live.email}>
            <input required type="email" className={inputClass} autoComplete="off" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Password" error={errors.password || live.password}>
            <input required type="password" className={inputClass} autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
          </Field>
          <Field label="City">
            <input required className={inputClass} autoComplete="off" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="Business type">
            <select className={inputClass} value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
              <option value="" />
              {['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Other'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="GSTIN" error={errors.gstNumber || live.gstNumber}>
            <input className={inputClass} autoComplete="off" value={form.gstNumber} onChange={(e) => set('gstNumber', normalizeGstin(e.target.value))} />
          </Field>
          <Field label="PAN" error={errors.panNumber || live.panNumber}>
            <input className={inputClass} autoComplete="off" value={form.panNumber} onChange={(e) => set('panNumber', normalizePan(e.target.value))} />
          </Field>

          <div className="sm:col-span-2 pt-2">
            <button disabled={loading || !verified} className="w-full bg-[#3083ff] hover:bg-[#1853ff] text-white font-black py-3.5 rounded-2xl transition disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create account & continue to KYC'}
            </button>
            <p className="text-center text-sm font-semibold text-slate-500 mt-4">
              Already registered?{' '}
              <Link to="/dealer/login" className="text-[#3083ff] font-black hover:underline">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children, span }) {
  return (
    <label className={`block ${span ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? <span className="text-[11px] font-bold text-rose-600 mt-1 block">{error}</span> : null}
    </label>
  );
}
