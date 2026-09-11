import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { persistDealerSession } from '../../app/authSlice';
import DevOtpHint from '../../components/DevOtpHint';
import {
  bankAccountError,
  emailError,
  gstinError,
  ifscError,
  inputClass,
  mobileError,
  normalizeGstin,
  normalizeIfsc,
  normalizeMobile,
  normalizePan,
  panError,
  passwordError,
} from '../../lib/kycValidation';

const DOC_TYPES = [
  ['pan_card', 'PAN card'],
  ['gst_certificate', 'GST certificate'],
  ['address_proof', 'Address proof'],
];

export default function DealerOnboarding() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const loggedIn = Boolean(token && user?.role === 'dealer');

  const [step, setStep] = useState(loggedIn ? 2 : 1);
  const [meta, setMeta] = useState({ businessTypes: [], kyc: [] });
  const [cities, setCities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mobileToken, setMobileToken] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    mobile: user?.mobile || '',
    otp: '',
    businessName: user?.dealershipName || '',
    legalEntityName: '',
    businessType: '',
    addressLine1: '',
    addressLine2: '',
    city: user?.city || '',
    state: '',
    pincode: '',
    googlePlaceId: '',
    geoLat: '',
    geoLng: '',
    operatingHours: {},
    panNumber: '',
    gstNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
  });

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  useEffect(() => {
    api.get('/meta/statuses').then((r) => setMeta(r.data || {})).catch(() => {});
    api.get('/cities').then((r) => setCities(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    api.get('/dealer/onboarding')
      .then((r) => {
        const p = r.data.data?.profile || {};
        setProfile(p);
        setStep(Number(r.data.data?.step) || 2);
        setForm((f) => ({
          ...f,
          name: p.contactPerson || f.name,
          email: p.contactEmail || f.email,
          mobile: p.contactPhone || f.mobile,
          businessName: p.businessName || f.businessName,
          legalEntityName: p.legalEntityName || '',
          businessType: p.businessType || '',
          addressLine1: p.addressLine1 || '',
          addressLine2: p.addressLine2 || '',
          city: p.city || f.city,
          state: p.state || '',
          pincode: p.pincode || '',
          googlePlaceId: p.googlePlaceId || '',
          geoLat: p.geo?.lat ?? '',
          geoLng: p.geo?.lng ?? '',
          operatingHours: p.operatingHours || {},
          panNumber: p.panNumber || '',
          gstNumber: p.gstNumber || '',
          bankAccountName: p.bankAccountName || '',
          bankAccountNumber: p.bankAccountNumber || '',
          bankIfsc: p.bankIfsc || '',
          bankName: p.bankName || '',
        }));
      })
      .catch(() => {});
  }, [loggedIn]);

  const states = useMemo(
    () => Array.from(new Set((Array.isArray(cities) ? cities : []).map((c) => c.state || c.name).filter(Boolean))).sort(),
    [cities]
  );
  const cityOptions = useMemo(() => {
    const list = Array.isArray(cities) ? cities : [];
    return form.state ? list.filter((c) => (c.state || '') === form.state) : list;
  }, [cities, form.state]);

  const live = useMemo(
    () => ({
      email: emailError(form.email),
      mobile: mobileError(form.mobile),
      password: passwordError(form.password),
      panNumber: panError(form.panNumber),
      gstNumber: gstinError(form.gstNumber, form.panNumber),
      bankIfsc: ifscError(form.bankIfsc),
      bankAccountNumber: bankAccountError(form.bankAccountNumber),
    }),
    [form]
  );

  const requestOtp = async () => {
    const err = mobileError(form.mobile) || (!form.mobile ? 'Mobile number is required' : '');
    if (err) return setErrors((e) => ({ ...e, mobile: err }));
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
    if (!/^\d{4}$/.test(form.otp)) return setErrors((e) => ({ ...e, otp: 'Enter the 4-digit OTP' }));
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

  const register = async () => {
    const next = {
      name: form.name.trim() ? '' : 'Contact person is required',
      email: emailError(form.email) || (!form.email ? 'Work email is required' : ''),
      password: passwordError(form.password) || (!form.password ? 'Password is required' : ''),
      mobile: mobileError(form.mobile) || (!form.mobile ? 'Mobile is required' : ''),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    if (!mobileToken) return toast.error('Verify mobile OTP before creating the account');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register-dealer', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        mobile: normalizeMobile(form.mobile),
        dealershipName: form.businessName.trim() || form.name.trim(),
        city: form.city,
        mobileVerifiedToken: mobileToken,
      });
      dispatch(persistDealerSession(data));
      toast.success('Account created');
      setStep(2);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  const saveStep = async (nextStep) => {
    setLoading(true);
    try {
      const { data } = await api.put('/dealer/onboarding', {
        contactPerson: form.name,
        contactEmail: form.email,
        contactPhone: normalizeMobile(form.mobile),
        businessName: form.businessName,
        legalEntityName: form.legalEntityName,
        businessType: form.businessType,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        googlePlaceId: form.googlePlaceId,
        geo: { lat: form.geoLat ? Number(form.geoLat) : null, lng: form.geoLng ? Number(form.geoLng) : null },
        operatingHours: form.operatingHours,
        panNumber: form.panNumber ? normalizePan(form.panNumber) : '',
        gstNumber: form.gstNumber ? normalizeGstin(form.gstNumber) : '',
        bankAccountName: form.bankAccountName,
        bankAccountNumber: form.bankAccountNumber.replace(/\s/g, ''),
        bankIfsc: form.bankIfsc ? normalizeIfsc(form.bankIfsc) : '',
        bankName: form.bankName,
        onboardingStep: nextStep,
      });
      setProfile(data.data);
      setStep(nextStep);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  const verifyKyc = async () => {
    const pan = panError(form.panNumber) || (!form.panNumber ? 'PAN is required' : '');
    const gst = gstinError(form.gstNumber, form.panNumber) || (!form.gstNumber ? 'GSTIN is required' : '');
    if (pan || gst) {
      setErrors((e) => ({ ...e, panNumber: pan, gstNumber: gst }));
      return;
    }
    setLoading(true);
    try {
      await api.post('/dealer/verify-kyc', {
        panNumber: normalizePan(form.panNumber),
        gstNumber: normalizeGstin(form.gstNumber),
      });
      toast.success('PAN and GSTIN verified');
      const { data } = await api.get('/dealer/onboarding');
      setProfile(data.data?.profile);
    } catch (e) {
      toast.error(e.response?.data?.message || 'KYC check failed');
    } finally {
      setLoading(false);
    }
  };

  const uploadDoc = async (type, file) => {
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    data.append('type', type);
    try {
      const res = await api.post('/kyc/me/documents', data);
      setProfile(res.data.data);
      toast.success('Document uploaded');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      await saveStep(4);
      const { data } = await api.post('/dealer/onboarding/submit');
      setProfile(data.data);
      toast.success('Submitted for admin approval');
      setStep(4);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not submit');
    } finally {
      setLoading(false);
    }
  };

  const pending = ['PENDING_ADMIN_APPROVAL', 'PENDING_KYC_APPROVAL', 'submitted', 'under_review'].includes(profile?.kycStatus)
    || profile?.onboardingStatus === 'PENDING_ADMIN_APPROVAL';
  const approved = profile?.kycStatus === 'approved' || profile?.onboardingStatus === 'APPROVED';
  const businessTypes = meta.businessTypes?.length ? meta.businessTypes : [];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-72px)]">
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#3083ff]">Dealer onboarding</p>
        <h1 className="font-display font-black text-3xl text-slate-900 mt-2">Join the 4TYREZZ network</h1>
        <p className="text-sm font-medium text-slate-500 mt-2">Inventory publishing stays locked until admin approval.</p>

        <ol className="grid grid-cols-4 gap-2 mt-8">
          {['Contact', 'Showroom', 'KYC', 'Review'].map((label, i) => (
            <li key={label} className={`rounded-xl px-2 py-2 text-center text-[10px] font-black uppercase tracking-wider ${step === i + 1 ? 'bg-[#3083ff] text-white' : step > i + 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-400 border border-slate-100'}`}>
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-3xl border border-white bg-white/90 p-6 sm:p-8 shadow-sm space-y-4">
          {step === 1 && (
            <>
              <Field label="Mobile" error={errors.mobile || live.mobile}>
                <div className="flex gap-2">
                  <input className={inputClass} value={form.mobile} disabled={Boolean(mobileToken)} onChange={(e) => set('mobile', normalizeMobile(e.target.value))} />
                  <button type="button" disabled={loading || Boolean(mobileToken)} onClick={requestOtp} className="shrink-0 px-4 rounded-2xl bg-slate-900 text-white text-xs font-black">Send OTP</button>
                </div>
              </Field>
              {otpSent && !mobileToken && (
                <Field label="OTP" error={errors.otp}>
                  <div className="flex gap-2">
                    <input className={inputClass} value={form.otp} onChange={(e) => set('otp', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                    <button type="button" onClick={verifyOtp} className="shrink-0 px-4 rounded-2xl bg-[#3083ff] text-white text-xs font-black">Verify</button>
                  </div>
                  <DevOtpHint code={devOtp} mobile={form.mobile} />
                </Field>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Contact person" error={errors.name}><input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
                <Field label="Work email" error={errors.email || live.email}><input className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
                <Field label="Password" error={errors.password || live.password}><input type="password" className={inputClass} value={form.password} onChange={(e) => set('password', e.target.value)} /></Field>
                <Field label="Dealership name"><input className={inputClass} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} /></Field>
              </div>
              <button type="button" disabled={loading} onClick={register} className="w-full bg-[#3083ff] text-white font-black rounded-2xl py-3.5">Create account & continue</button>
            </>
          )}

          {step === 2 && loggedIn && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Dealership legal name"><input className={inputClass} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} /></Field>
                <Field label="Legal entity name"><input className={inputClass} value={form.legalEntityName} onChange={(e) => set('legalEntityName', e.target.value)} /></Field>
                <Field label="Business type">
                  <select className={inputClass} value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
                    <option value="">Select</option>
                    {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Operating address"><input className={inputClass} value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} /></Field>
                <Field label="Address line 2"><input className={inputClass} value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} /></Field>
                <Field label="State">
                  <select className={inputClass} value={form.state} onChange={(e) => set('state', e.target.value)}>
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="City">
                  <select className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)}>
                    <option value="">Select city</option>
                    {cityOptions.map((c) => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Pincode"><input className={inputClass} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} /></Field>
                <Field label="Google Place ID"><input className={inputClass} value={form.googlePlaceId} onChange={(e) => set('googlePlaceId', e.target.value)} placeholder="ChIJ..." /></Field>
                <Field label="Latitude"><input className={inputClass} value={form.geoLat} onChange={(e) => set('geoLat', e.target.value)} /></Field>
                <Field label="Longitude"><input className={inputClass} value={form.geoLng} onChange={(e) => set('geoLng', e.target.value)} /></Field>
              </div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Operating hours</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <label key={day} className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-10 text-slate-500">{day}</span>
                    <input
                      className={inputClass}
                      placeholder="09:00-18:00"
                      value={form.operatingHours?.[day] || ''}
                      onChange={(e) => set('operatingHours', { ...(form.operatingHours || {}), [day]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button type="button" disabled={loading} onClick={() => saveStep(3)} className="bg-[#3083ff] text-white font-black rounded-2xl px-6 py-3">Save & continue</button>
              </div>
            </>
          )}

          {step === 3 && loggedIn && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="PAN" error={errors.panNumber || live.panNumber}><input className={inputClass} value={form.panNumber} onChange={(e) => set('panNumber', normalizePan(e.target.value))} /></Field>
                <Field label="GSTIN" error={errors.gstNumber || live.gstNumber}><input className={inputClass} value={form.gstNumber} onChange={(e) => set('gstNumber', normalizeGstin(e.target.value))} /></Field>
                <Field label="Account holder"><input className={inputClass} value={form.bankAccountName} onChange={(e) => set('bankAccountName', e.target.value)} /></Field>
                <Field label="Account number" error={live.bankAccountNumber}><input className={inputClass} value={form.bankAccountNumber} onChange={(e) => set('bankAccountNumber', e.target.value.replace(/\D/g, ''))} /></Field>
                <Field label="IFSC" error={live.bankIfsc}><input className={inputClass} value={form.bankIfsc} onChange={(e) => set('bankIfsc', normalizeIfsc(e.target.value))} /></Field>
                <Field label="Bank name"><input className={inputClass} value={form.bankName} onChange={(e) => set('bankName', e.target.value)} /></Field>
              </div>
              <button type="button" onClick={verifyKyc} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wider">Verify PAN & GSTIN</button>
              <p className="text-xs font-bold text-slate-500">{profile?.panVerified ? 'PAN verified' : 'PAN pending'} · {profile?.gstVerified ? 'GSTIN verified' : 'GSTIN pending'}</p>
              <div className="space-y-3">
                {DOC_TYPES.map(([type, label]) => (
                  <label key={type} className="block rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold">
                    {label}
                    <input type="file" accept="application/pdf,image/*" className="mt-2 block text-xs" onChange={(e) => uploadDoc(type, e.target.files?.[0])} />
                    {(profile?.documents || []).find((d) => d.type === type) && <span className="text-emerald-600 text-xs font-black">Uploaded</span>}
                  </label>
                ))}
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="font-bold text-slate-500">Back</button>
                <button type="button" disabled={loading} onClick={submit} className="bg-[#3083ff] text-white font-black rounded-2xl px-6 py-3">Submit for admin approval</button>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <p className="font-display font-black text-2xl text-slate-900">
                {approved ? 'You are verified' : pending ? 'Pending admin approval' : 'Onboarding incomplete'}
              </p>
              <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md mx-auto">
                {approved
                  ? 'You can publish inventory and receive buyer leads.'
                  : 'Operations is reviewing your KYC. Inventory publishing stays locked until status is APPROVED.'}
              </p>
              <p className="mt-4 text-[11px] font-black uppercase tracking-wider text-amber-700">{profile?.kycStatus || profile?.onboardingStatus}</p>
              <Link to="/dealer/dashboard" className="inline-block mt-6 bg-[#3083ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3">Go to dashboard</Link>
            </div>
          )}
        </div>
      </div>
    </div>
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
