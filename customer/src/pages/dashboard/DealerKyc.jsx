import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  emailError,
  gstinError,
  inputClass,
  mobileError,
  normalizeGstin,
  normalizeMobile,
  normalizePan,
  panError,
  PINCODE_REGEX,
} from '../../lib/kycValidation';

const DOC_LABELS = {
  gst_certificate: 'GST certificate',
  pan_card: 'PAN card',
  address_proof: 'Address proof',
  aadhaar: 'Aadhaar (optional)',
  cancelled_cheque: 'Cancelled cheque (optional)',
};

const REQUIRED_DOCS = ['gst_certificate', 'pan_card', 'address_proof'];
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const STATUS_COPY = {
  not_started: ['Not started', 'Fill the business details, verify PAN/GSTIN, then upload documents.'],
  draft: ['In progress', 'Save anytime. Submit when every required field, live KYC check and document is on file.'],
  PENDING_KYC_APPROVAL: ['Pending KYC approval', 'Operations is reviewing your file. Inventory stays locked until kycVerified is true.'],
  submitted: ['Submitted', 'Operations is reviewing your file. Listings stay locked until approval.'],
  under_review: ['Under review', 'Our team is verifying GST, PAN and address documents.'],
  approved: ['Approved', 'You can list inspected inventory and receive buyer leads.'],
  rejected: ['Needs changes', 'See the note below, update the file, and resubmit.'],
};

const FIELDS = [
  ['businessName', 'Dealership name'],
  ['legalEntityName', 'Legal entity name'],
  ['gstNumber', 'GSTIN'],
  ['panNumber', 'PAN'],
  ['contactPerson', 'Contact person'],
  ['contactPhone', 'Contact phone'],
  ['contactEmail', 'Contact email'],
  ['addressLine1', 'Address line 1'],
  ['addressLine2', 'Address line 2'],
  ['city', 'City'],
  ['state', 'State'],
  ['pincode', 'Pincode'],
];

function fieldError(key, value, form) {
  if (key === 'panNumber') return panError(value);
  if (key === 'gstNumber') return gstinError(value, form.panNumber);
  if (key === 'contactPhone') return mobileError(value);
  if (key === 'contactEmail') return emailError(value);
  if (key === 'pincode' && value && !PINCODE_REGEX.test(value)) return 'Enter a valid 6-digit pincode';
  return '';
}

export default function DealerKyc() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const load = async () => {
    const { data } = await api.get('/kyc/me');
    setProfile(data.data);
    setForm(data.data || {});
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const locked = ['submitted', 'under_review', 'approved'].includes(profile?.kycStatus)
    || (profile?.kycStatus === 'PENDING_KYC_APPROVAL' && Boolean(profile?.submittedAt));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const liveErrors = useMemo(() => {
    const next = {};
    FIELDS.forEach(([key]) => {
      const err = fieldError(key, form[key] || '', form);
      if (err) next[key] = err;
    });
    return next;
  }, [form]);

  const save = async () => {
    if (liveErrors.panNumber || liveErrors.gstNumber || liveErrors.contactPhone || liveErrors.contactEmail || liveErrors.pincode) {
      toast.error('Fix the highlighted fields before saving');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/kyc/me', {
        ...form,
        panNumber: form.panNumber ? normalizePan(form.panNumber) : '',
        gstNumber: form.gstNumber ? normalizeGstin(form.gstNumber) : '',
        contactPhone: form.contactPhone ? normalizeMobile(form.contactPhone) : '',
      });
      setProfile(data.data);
      toast.success('Draft saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    if (liveErrors.panNumber || liveErrors.gstNumber || !form.panNumber || !form.gstNumber) {
      toast.error('Enter a valid PAN and GSTIN first');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/dealer/verify-kyc', {
        panNumber: normalizePan(form.panNumber),
        gstNumber: normalizeGstin(form.gstNumber),
      });
      toast.success('PAN and GSTIN verified');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      await api.put('/kyc/me', form);
      const { data } = await api.post('/kyc/me/submit');
      setProfile(data.data);
      toast.success('KYC submitted for approval');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cannot submit yet');
    } finally {
      setSaving(false);
    }
  };

  const upload = async (type, file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('File must be 5MB or smaller');
      return;
    }
    if (file.type && !ALLOWED.includes(file.type)) {
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

  if (loading) return <p className="text-sm font-semibold text-slate-500">Loading KYC…</p>;
  if (!profile) return <p className="text-sm font-semibold text-rose-600">Could not load KYC profile.</p>;

  const [statusLabel, statusBody] = STATUS_COPY[profile.kycStatus] || STATUS_COPY.draft;
  const fileOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3083ff]">Dealer KYC</p>
            <h2 className="font-display text-2xl font-black text-slate-900 mt-1">{statusLabel}</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 max-w-xl">{statusBody}</p>
            <p className="text-xs font-bold mt-2">
              Operational flag: <span className={profile.kycVerified ? 'text-emerald-600' : 'text-amber-600'}>{profile.kycVerified ? 'kycVerified' : 'not verified'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">{profile.completionPercent || 0}%</p>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Complete</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-[#3083ff] rounded-full transition-all" style={{ width: `${profile.completionPercent || 0}%` }} />
        </div>
        {profile.kycStatus === 'rejected' && profile.rejectionReason && (
          <p className="mt-4 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
            {profile.rejectionReason}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-display font-black text-lg text-slate-900">Business details</h3>
          {FIELDS.map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
              <input
                disabled={locked}
                className={`${inputClass} mt-1.5`}
                value={form[key] || ''}
                onChange={(e) => {
                  let v = e.target.value;
                  if (key === 'panNumber') v = normalizePan(v);
                  if (key === 'gstNumber') v = normalizeGstin(v);
                  if (key === 'contactPhone') v = normalizeMobile(v);
                  if (key === 'pincode') v = v.replace(/\D/g, '').slice(0, 6);
                  set(key, v);
                }}
              />
              {liveErrors[key] && <span className="text-[11px] font-bold text-rose-600 mt-1 block">{liveErrors[key]}</span>}
            </label>
          ))}
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Business type</span>
            <select disabled={locked} className={`${inputClass} mt-1.5`} value={form.businessType || ''} onChange={(e) => set('businessType', e.target.value)}>
              <option value="" />
              {['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Other'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className={profile.panVerified ? 'text-emerald-600' : 'text-slate-400'}>PAN {profile.panVerified ? 'verified' : 'not verified'}</span>
            <span className={profile.gstVerified ? 'text-emerald-600' : 'text-slate-400'}>GSTIN {profile.gstVerified ? 'verified' : 'not verified'}</span>
          </div>
          {!locked && (
            <button type="button" onClick={verify} disabled={verifying} className="w-full rounded-2xl border border-[#3083ff] text-[#3083ff] font-black text-sm py-3">
              {verifying ? 'Verifying…' : 'Run live PAN / GSTIN check'}
            </button>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-display font-black text-lg text-slate-900">Documents</h3>
          <p className="text-xs font-semibold text-slate-400">PDF, JPG or PNG · max 5MB</p>
          {Object.entries(DOC_LABELS).map(([type, label]) => {
            const doc = (profile.documents || []).find((d) => d.type === type);
            const required = REQUIRED_DOCS.includes(type);
            return (
              <div key={type} className="border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {label} {required && <span className="text-[#3083ff]">*</span>}
                    </p>
                    {doc && (
                      <a href={`${fileOrigin}${doc.url}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#3083ff]">
                        {doc.originalName || 'View file'}
                      </a>
                    )}
                    {!doc && <p className="text-xs font-semibold text-slate-400">Not uploaded</p>}
                  </div>
                  {!locked && (
                    <label className="text-xs font-black uppercase tracking-wider text-[#3083ff] cursor-pointer">
                      {doc ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => upload(type, e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {!locked && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={save} disabled={saving} className="px-6 py-3 rounded-2xl border border-slate-200 font-black text-sm hover:bg-slate-50">
            Save draft
          </button>
          <button type="button" onClick={submit} disabled={saving || !profile.canSubmit} className="px-6 py-3 rounded-2xl bg-[#3083ff] text-white font-black text-sm hover:bg-[#1853ff] disabled:opacity-60">
            Submit for review
          </button>
        </div>
      )}

      {profile.missing && !locked && (
        <p className="text-xs font-semibold text-slate-400">
          Still needed:{' '}
          {[...(profile.missing.fields || []), ...(profile.missing.documents || []), !profile.panVerified ? 'PAN live check' : '', !profile.gstVerified ? 'GSTIN live check' : ''].filter(Boolean).join(', ') || 'nothing — you can submit'}
        </p>
      )}
    </div>
  );
}
