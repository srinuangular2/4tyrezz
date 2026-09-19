import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  bankAccountError,
  emailError,
  gstinError,
  ifscError,
  mobileError,
  normalizeGstin,
  normalizeIfsc,
  normalizeMobile,
  normalizePan,
  panError,
  PINCODE_REGEX,
  inputClass,
} from '../../lib/kycValidation';

const STEPS = [
  { id: 1, label: 'Contact', hint: 'Who we should reach' },
  { id: 2, label: 'Showroom', hint: 'Where you operate' },
  { id: 3, label: 'KYC', hint: 'PAN, GST and bank' },
  { id: 4, label: 'Review', hint: 'Check and submit' },
];

const DOC_TYPES = [
  ['pan_card', 'PAN card'],
  ['gst_certificate', 'GST certificate'],
  ['address_proof', 'Address proof'],
];

const FALLBACK_TYPES = ['Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Other'];
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
export default function DealerOnboarding() {
  const { user, token } = useSelector((s) => s.auth);
  const loggedIn = Boolean(token && user?.role === 'dealer');

  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState({ businessTypes: [] });
  const [cities, setCities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    businessName: user?.dealershipName || '',
    legalEntityName: '',
    businessType: '',
    addressLine1: '',
    addressLine2: '',
    city: user?.city || '',
    state: '',
    pincode: '',
    panNumber: '',
    gstNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/meta/statuses').then((r) => setMeta(r.data || {})).catch(() => {});
    api.get('/cities').then((r) => setCities(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setLoaded(true);
      return;
    }
    api.get('/dealer/onboarding')
      .then((r) => {
        const p = r.data.data?.profile || {};
        setProfile(p);
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
          panNumber: p.panNumber || '',
          gstNumber: p.gstNumber || '',
          bankAccountName: p.bankAccountName || '',
          bankAccountNumber: p.bankAccountNumber || '',
          bankIfsc: p.bankIfsc || '',
          bankName: p.bankName || '',
        }));
        const apiStep = Number(r.data.data?.step) || 1;
        setStep(Math.min(Math.max(apiStep, 1), 4));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [loggedIn]);

  const states = useMemo(
    () => Array.from(new Set((Array.isArray(cities) ? cities : []).map((c) => c.state).filter(Boolean))).sort(),
    [cities]
  );
  const cityOptions = useMemo(() => {
    const list = Array.isArray(cities) ? cities : [];
    return form.state ? list.filter((c) => (c.state || '') === form.state) : list;
  }, [cities, form.state]);

  const businessTypes = meta.businessTypes?.length ? meta.businessTypes : FALLBACK_TYPES;
  const docs = profile?.documents || [];
  const hasDoc = (type) => docs.some((d) => d.type === type);
  const docName = (type) => docs.find((d) => d.type === type)?.originalName;

  const checks = useMemo(() => {
    const nameOk = Boolean(String(form.name || '').trim());
    const emailOk = Boolean(form.email) && !emailError(form.email);
    const mobileOk = Boolean(form.mobile) && !mobileError(form.mobile);
    const pinOk = PINCODE_REGEX.test(String(form.pincode || ''));
    const showroomOk = Boolean(
      String(form.businessName || '').trim()
      && form.businessType
      && String(form.addressLine1 || '').trim()
      && form.state
      && String(form.city || '').trim()
      && pinOk
    );
    const panOk = Boolean(form.panNumber) && !panError(form.panNumber);
    const gstOk = Boolean(form.gstNumber) && !gstinError(form.gstNumber, form.panNumber);
    const bankOk = Boolean(String(form.bankAccountName || '').trim())
      && Boolean(form.bankAccountNumber)
      && !bankAccountError(form.bankAccountNumber)
      && Boolean(form.bankIfsc)
      && !ifscError(form.bankIfsc)
      && Boolean(String(form.bankName || '').trim());
    const docsOk = DOC_TYPES.every(([type]) => hasDoc(type));
    const panMatches = normalizePan(form.panNumber) === normalizePan(profile?.panNumber || '');
    const gstMatches = normalizeGstin(form.gstNumber) === normalizeGstin(profile?.gstNumber || '');
    const verified = Boolean(profile?.panVerified && profile?.gstVerified && panMatches && gstMatches);
    return {
      nameOk,
      emailOk,
      mobileOk,
      showroomOk,
      panOk,
      gstOk,
      bankOk,
      docsOk,
      verified,
      1: nameOk && emailOk && mobileOk,
      2: showroomOk,
      3: panOk && gstOk && bankOk && docsOk && verified,
      4: panOk && gstOk && bankOk && docsOk && verified,
    };
  }, [form, profile, docs]);

  const pending = ['PENDING_ADMIN_APPROVAL', 'PENDING_KYC_APPROVAL', 'submitted', 'under_review'].includes(profile?.kycStatus)
    || profile?.onboardingStatus === 'PENDING_ADMIN_APPROVAL';
  const approved = profile?.kycStatus === 'approved' || profile?.onboardingStatus === 'APPROVED';
  const locked = pending || approved;
  const canGo = Boolean(checks[step]) && !loading && !locked;
  const canBrowseSteps = true;

  const nextHint = useMemo(() => {
    if (canGo || locked) return '';
    if (step === 1) {
      if (!checks.nameOk) return 'Enter the contact person’s full name.';
      if (!checks.mobileOk) return 'Enter a valid 10-digit mobile number.';
      return 'Enter a valid work email to continue.';
    }
    if (step === 2) return 'Fill dealership name, type, address, state, city and a 6-digit pincode.';
    if (step === 3) {
      if (!checks.panOk || !checks.gstOk) return 'Enter a valid PAN and GSTIN.';
      if (!checks.bankOk) return 'Complete account holder, account number, IFSC and bank name.';
      if (!checks.docsOk) return 'Upload PAN card, GST certificate and address proof.';
      return 'Verify PAN and GSTIN before you can continue.';
    }
    return 'Complete KYC verification before you can submit.';
  }, [canGo, locked, step, checks]);

  const stepPayload = (current) => {
    if (current === 1) {
      return {
        contactPerson: String(form.name || '').trim(),
        contactEmail: String(form.email || '').trim().toLowerCase(),
        contactPhone: normalizeMobile(form.mobile),
        onboardingStep: 1,
      };
    }
    if (current === 2) {
      return {
        businessName: String(form.businessName || '').trim(),
        legalEntityName: String(form.legalEntityName || '').trim(),
        businessType: form.businessType,
        addressLine1: String(form.addressLine1 || '').trim(),
        addressLine2: String(form.addressLine2 || '').trim(),
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        onboardingStep: 2,
      };
    }
    return {
      panNumber: normalizePan(form.panNumber),
      gstNumber: normalizeGstin(form.gstNumber),
      bankAccountName: String(form.bankAccountName || '').trim(),
      bankAccountNumber: String(form.bankAccountNumber || '').replace(/\s/g, ''),
      bankIfsc: normalizeIfsc(form.bankIfsc),
      bankName: String(form.bankName || '').trim(),
      onboardingStep: 3,
    };
  };

  const save = async (current) => {
    const { data } = await api.put('/dealer/onboarding', stepPayload(current));
    setProfile(data.data);
    return data.data;
  };

  const goNext = async () => {
    if (!canGo || step >= 4) return;
    setLoading(true);
    try {
      await save(step);
      setStep((s) => Math.min(s + 1, 4));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save this step');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (loading || step === 1) return;
    setStep((s) => Math.max(s - 1, 1));
  };

  const saveCurrent = async () => {
    if (loading || step === 4) return;
    setLoading(true);
    try {
      await save(step);
      toast.success('Changes saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save this step');
    } finally {
      setLoading(false);
    }
  };

  const verifyKyc = async () => {
    if (!checks.panOk || !checks.gstOk) {
      toast.error('Enter a valid PAN and GSTIN first');
      return;
    }
    setLoading(true);
    try {
      await save(3);
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
    if (file.size > MAX_BYTES) {
      toast.error('File must be 5 MB or smaller');
      return;
    }
    if (file.type && !ALLOWED_FILES.includes(file.type)) {
      toast.error('Only PDF, JPG and PNG are allowed');
      return;
    }
    const body = new FormData();
    body.append('file', file);
    body.append('type', type);
    try {
      const { data } = await api.post('/kyc/me/documents', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(data.data);
      toast.success('Document uploaded');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    }
  };

  const submit = async () => {
    if (!checks[4] || loading || locked) return;
    setLoading(true);
    try {
      await save(3);
      const { data } = await api.post('/dealer/onboarding/submit');
      setProfile(data.data);
      toast.success('Submitted for admin approval');
      setStep(4);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Complete every required field before submitting');
    } finally {
      setLoading(false);
    }
  };

  const onFormKeyDown = (e) => {
    if (e.key !== 'Enter' || e.target?.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (step < 4) goNext();
    else submit();
  };

  if (!loggedIn) {
    return (
      <Shell>
        <div className="text-center py-10">
          <p className="font-black text-slate-900 text-xl">Sign in to continue onboarding</p>
          <p className="text-sm font-semibold text-slate-500 mt-2">Use the Dealer ID issued by 4tyrezz admin.</p>
          <Link to="/dealer/login" className="inline-block mt-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl px-6 py-3">
            Sign in with Dealer ID
          </Link>
        </div>
      </Shell>
    );
  }

  if (!loaded) {
    return (
      <Shell>
        <p className="text-sm font-semibold text-slate-500 py-10 text-center">Loading your onboarding file…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      {locked && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {approved ? 'KYC is approved. You can open any step to review or update details.' : 'KYC is with admin for review. You can still open previous steps.'}
        </div>
      )}
      <ol className="grid grid-cols-4 gap-2 mt-6">
        {STEPS.map((item) => {
          const active = step === item.id;
          const done = step > item.id || (locked && item.id < 4);
          const clickable = canBrowseSteps && item.id !== step;
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={!clickable && !active}
                onClick={() => clickable && setStep(item.id)}
                className={`w-full rounded-2xl px-2 py-3 text-center transition ${
                  active
                    ? 'bg-[#3083ff] text-white shadow-md'
                    : done
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-white text-slate-400 border border-slate-200'
                } ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/20' : 'cursor-default'}`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider">{item.id}. {item.label}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${active ? 'text-white/80' : 'text-slate-400'}`}>{item.hint}</p>
              </button>
            </li>
          );
        })}
      </ol>

      <form
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={onFormKeyDown}
      >
        <>
            {locked && step === 4 && (
              <div className="text-center py-4 mb-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="font-display font-black text-2xl text-slate-900">
                  {approved ? 'You are verified' : 'KYC sent for review'}
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md mx-auto">
                  {approved
                    ? 'Use the steps above to review contact, showroom and KYC. Listings still go to admin before they go live.'
                    : 'Operations is reviewing your file. Inventory stays locked until you are approved.'}
                </p>
                <p className="mt-4 text-[11px] font-black uppercase tracking-wider text-amber-700">{profile?.kycStatus}</p>
                <Link to="/dealer/dashboard" className="inline-block mt-6 bg-[#3083ff] hover:bg-[#1853ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3">
                  Go to dashboard
                </Link>
              </div>
            )}
          <>
            {step === 1 && (
              <section className="space-y-4">
                <Header title="Contact person" body="We use this to reach you about KYC and listing approvals." />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" required>
                    <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ramesh Kumar" autoComplete="name" />
                  </Field>
                  <Field label="Mobile" required error={form.mobile ? mobileError(form.mobile) : ''}>
                    <input className={inputClass} value={form.mobile} onChange={(e) => set('mobile', normalizeMobile(e.target.value))} placeholder="10-digit mobile" inputMode="numeric" autoComplete="tel" />
                  </Field>
                  <Field label="Work email" required error={form.email ? emailError(form.email) : ''} className="sm:col-span-2">
                    <input className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="dealer@showroom.com" autoComplete="email" />
                  </Field>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <Header title="Showroom details" body="Buyers never see this. 4tyrezz uses it for ops and payouts." />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Dealership name" required>
                    <input className={inputClass} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
                  </Field>
                  <Field label="Legal entity name">
                    <input className={inputClass} value={form.legalEntityName} onChange={(e) => set('legalEntityName', e.target.value)} />
                  </Field>
                  <Field label="Business type" required>
                    <select className={inputClass} value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
                      <option value="">Select</option>
                      {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Pincode" required error={form.pincode && !PINCODE_REGEX.test(form.pincode) ? 'Enter a valid 6-digit pincode' : ''}>
                    <input className={inputClass} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="500034" inputMode="numeric" />
                  </Field>
                  <Field label="Address" required className="sm:col-span-2">
                    <input className={inputClass} value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} placeholder="Street, area" />
                  </Field>
                  <Field label="Address line 2" className="sm:col-span-2">
                    <input className={inputClass} value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} />
                  </Field>
                  <Field label="State" required>
                    <select className={inputClass} value={form.state} onChange={(e) => { set('state', e.target.value); set('city', ''); }}>
                      <option value="">Select state</option>
                      {states.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="City" required>
                    {cityOptions.length ? (
                      <select className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)}>
                        <option value="">Select city</option>
                        {form.city && !cityOptions.some((c) => c.name === form.city) ? (
                          <option value={form.city}>{form.city}</option>
                        ) : null}
                        {cityOptions.map((c) => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    ) : (
                      <input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
                    )}
                  </Field>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-5">
                <Header title="KYC and payouts" body="PAN, GSTIN and bank details are required before admin can approve you." />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="PAN" required error={panError(form.panNumber)}>
                    <input className={inputClass} value={form.panNumber} onChange={(e) => set('panNumber', normalizePan(e.target.value))} />
                  </Field>
                  <Field label="GSTIN" required error={gstinError(form.gstNumber, form.panNumber)}>
                    <input className={inputClass} value={form.gstNumber} onChange={(e) => set('gstNumber', normalizeGstin(e.target.value))} />
                  </Field>
                  <Field label="Account holder" required>
                    <input className={inputClass} value={form.bankAccountName} onChange={(e) => set('bankAccountName', e.target.value)} />
                  </Field>
                  <Field label="Account number" required error={bankAccountError(form.bankAccountNumber)}>
                    <input className={inputClass} value={form.bankAccountNumber} onChange={(e) => set('bankAccountNumber', e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
                  </Field>
                  <Field label="IFSC" required error={ifscError(form.bankIfsc)}>
                    <input className={inputClass} value={form.bankIfsc} onChange={(e) => set('bankIfsc', normalizeIfsc(e.target.value))} />
                  </Field>
                  <Field label="Bank name" required>
                    <input className={inputClass} value={form.bankName} onChange={(e) => set('bankName', e.target.value)} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={verifyKyc}
                    disabled={loading || !checks.panOk || !checks.gstOk}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wider disabled:opacity-40"
                  >
                    Verify PAN & GSTIN
                  </button>
                  <p className={`text-xs font-bold ${checks.verified ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {checks.verified ? 'PAN and GSTIN verified' : `${profile?.panVerified ? 'PAN verified' : 'PAN pending'} · ${profile?.gstVerified ? 'GSTIN verified' : 'GSTIN pending'}`}
                  </p>
                </div>
                <div className="space-y-3">
                  {DOC_TYPES.map(([type, label]) => (
                    <label key={type} className="block rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold">
                      {label} <span className="text-rose-500">*</span>
                      <input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-2 block text-xs" onChange={(e) => uploadDoc(type, e.target.files?.[0])} />
                      {hasDoc(type) && (
                        <span className="text-emerald-600 text-xs font-black">
                          Uploaded{docName(type) ? ` · ${docName(type)}` : ''}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-5">
                <Header title="Review and submit" body="Confirm the details below. Use Back to edit before sending to 4tyrezz admin." />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Summary label="Contact" value={`${form.name} · ${form.mobile}`} />
                  <Summary label="Email" value={form.email} />
                  <Summary label="Dealership" value={form.businessName} />
                  <Summary label="Type" value={form.businessType} />
                  <Summary label="Address" value={[form.addressLine1, form.city, form.state, form.pincode].filter(Boolean).join(', ')} />
                  <Summary label="PAN / GSTIN" value={`${form.panNumber || '—'} · ${form.gstNumber || '—'}`} />
                  <Summary label="Bank" value={`${form.bankName || '—'} · ${form.bankIfsc || '—'}`} />
                  <Summary label="Documents" value={checks.docsOk ? 'All uploaded' : 'Missing files'} />
                </div>
                {!checks.verified ? (
                  <p className="text-sm font-semibold text-amber-700">Go back to KYC and verify PAN and GSTIN before you can submit.</p>
                ) : null}
              </section>
            )}

            <div className="mt-8 pt-5 border-t border-slate-100">
              {nextHint ? <p className="text-xs font-semibold text-slate-500 mb-3">{nextHint}</p> : null}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1 || loading}
                  className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                {step < 4 ? (
                  <div className="flex gap-2">
                    {locked && (
                      <button
                        type="button"
                        onClick={saveCurrent}
                        disabled={loading}
                        className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm font-black disabled:opacity-40"
                      >
                        {loading ? 'Saving…' : 'Save changes'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => (locked ? setStep((s) => Math.min(s + 1, 4)) : goNext())}
                      disabled={locked ? loading : !canGo}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black disabled:opacity-40 disabled:bg-slate-700 disabled:cursor-not-allowed"
                    >
                      {loading && !locked ? 'Saving…' : 'Next'}
                    </button>
                  </div>
                ) : (
                  !locked && (
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!canGo}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black disabled:opacity-40 disabled:bg-slate-700 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Submitting…' : 'Submit for approval'}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        </>
      </form>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#3083ff]">Dealer onboarding</p>
      <h1 className="font-display font-black text-3xl text-slate-900 mt-2">Join the 4TYREZZ network</h1>
      <p className="text-sm font-medium text-slate-500 mt-2">Open any step to review or edit. Next stays off until the required fields on this page are filled.</p>
      {children}
    </div>
  );
}

function Header({ title, body }) {
  return (
    <div>
      <h2 className="font-display font-black text-xl text-slate-900">{title}</h2>
      <p className="text-sm font-medium text-slate-500 mt-1">{body}</p>
    </div>
  );
}

function Field({ label, required, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <div className="mt-1.5">{children}</div>
      {error ? <span className="text-[11px] font-bold text-rose-600 mt-1 block">{error}</span> : null}
    </label>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900 mt-1">{value || '—'}</p>
    </div>
  );
}
