import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { emailError, inputClass, mobileError, PINCODE_REGEX } from '../../lib/kycValidation';
import { fetchMe } from '../../app/authSlice';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { compressImage, mediaUrl } from './hubUtils';

const blankAddress = { label: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

export default function Settings() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    preferredCity: '',
    preferredBrands: [],
    preferredModels: [],
    budgetMin: '',
    budgetMax: '',
    avatar: '',
    emailVerified: false,
    mobileVerified: false,
  });
  const [cities, setCities] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [priceRange, setPriceRange] = useState(null);
  const [errors, setErrors] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [addr, setAddr] = useState(blankAddress);
  const [saving, setSaving] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState(location.state?.verifyEmailUrl || '');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    api
      .get('/user/profile')
      .then((r) => {
        const d = r.data.data || {};
        setForm({
          name: d.name || '',
          email: d.email || '',
          mobile: d.mobile || '',
          preferredCity: d.preferredCity || d.city || '',
          preferredBrands: d.preferredBrands || [],
          preferredModels: d.preferredModels || [],
          budgetMin: d.budgetMin ?? '',
          budgetMax: d.budgetMax ?? '',
          avatar: d.avatar || '',
          emailVerified: Boolean(d.emailVerified),
          mobileVerified: Boolean(d.mobileVerified),
        });
      })
      .catch(() => {
        setForm((f) => ({
          ...f,
          name: user?.name || '',
          email: user?.email || '',
          mobile: user?.mobile || '',
        }));
      });
    api.get('/user/addresses').then((r) => setAddresses(r.data.data || [])).catch(() => setAddresses([]));
    api.get('/cities').then((r) => setCities(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => setCities([]));
    api.get('/brands').then((r) => setBrands(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => setBrands([]));
    api.get('/meta/car-filters').then((r) => {
      const min = r.data?.priceRange?.min;
      const max = r.data?.priceRange?.max;
      if (min != null && max != null && Number(max) > Number(min)) {
        setPriceRange({ min: Number(min), max: Number(max) });
      }
    }).catch(() => setPriceRange(null));
  }, [user]);

  useEffect(() => {
    const selected = form.preferredBrands;
    if (!selected.length || !brands.length) {
      setModels([]);
      return;
    }
    const ids = brands.filter((b) => selected.includes(b.name)).map((b) => b._id);
    if (!ids.length) {
      setModels([]);
      return;
    }
    Promise.all(ids.map((id) => api.get('/models', { params: { brand: id } })))
      .then((rows) => setModels(rows.flatMap((r) => (Array.isArray(r.data) ? r.data : r.data?.data || []))))
      .catch(() => setModels([]));
  }, [form.preferredBrands, brands]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: k === 'email' ? emailError(v) : k === 'mobile' ? mobileError(v) : '' }));
  };

  const toggleTag = (key, value) => {
    setForm((f) => {
      const cur = new Set(f[key] || []);
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      return { ...f, [key]: [...cur] };
    });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const next = { email: emailError(form.email), mobile: form.mobile ? mobileError(form.mobile) : '' };
    setErrors(next);
    if (next.email || next.mobile) return;
    setSaving(true);
    try {
      await api.put('/user/profile/preferences', {
        name: form.name.trim(),
        email: form.email.trim(),
        preferredCity: form.preferredCity,
        preferredBrands: form.preferredBrands,
        preferredModels: form.preferredModels,
        budgetMin: form.budgetMin === '' ? null : Number(form.budgetMin),
        budgetMax: form.budgetMax === '' ? null : Number(form.budgetMax),
      });
      await dispatch(fetchMe());
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file');
    try {
      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed));
      const body = new FormData();
      body.append('photo', compressed);
      const { data } = await api.post('/user/profile-photo', body);
      setForm((f) => ({ ...f, avatar: data.avatar }));
      await dispatch(fetchMe());
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload photo');
    }
  };

  const resendVerify = async () => {
    try {
      const { data } = await api.post('/auth/resend-verification');
      setVerifyUrl(data.verifyEmailUrl || '');
      toast.success(data.message || 'Verification link issued');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend');
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    if (!addr.line1 || !addr.city) return toast.error('Address line and city are required');
    if (addr.pincode && !PINCODE_REGEX.test(addr.pincode)) return toast.error('Enter a valid 6-digit pincode');
    try {
      const { data } = await api.post('/user/addresses', addr);
      setAddresses(data.data || []);
      setAddr(blankAddress);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    }
  };

  const removeAddress = async (id) => {
    const { data } = await api.delete(`/user/addresses/${id}`);
    setAddresses(data.data || []);
  };

  const sliderMin = priceRange?.min ?? 0;
  const sliderMax = priceRange?.max ?? 0;
  const budgetLabel = useMemo(() => {
    if (form.budgetMin === '' && form.budgetMax === '') return 'Not set';
    return `${formatINR(form.budgetMin || sliderMin)} – ${formatINR(form.budgetMax || sliderMax)}`;
  }, [form.budgetMin, form.budgetMax, sliderMin, sliderMax]);

  const avatarSrc = preview || mediaUrl(form.avatar);

  return (
    <div className="space-y-6">
      <ProfileCard eyebrow="Account" title="My profile">
        {verifyUrl && (
          <p className="mb-4 text-xs font-semibold text-slate-600 break-all">
            Verify email: <a href={verifyUrl} className="text-[#3083ff] font-black">{verifyUrl}</a>
          </p>
        )}
        <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
              {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <label className="text-xs font-black text-[#3083ff] cursor-pointer">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Full name</span>
            <input className={`${inputClass} mt-1.5`} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Mobile {form.mobileVerified ? '· verified' : ''}
            </span>
            <input className={`${inputClass} mt-1.5`} value={form.mobile} disabled />
            {errors.mobile && <span className="text-[11px] font-bold text-rose-600 mt-1 block">{errors.mobile}</span>}
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Email {form.emailVerified ? '· verified' : '· unverified'}
            </span>
            <input className={`${inputClass} mt-1.5`} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            {errors.email && <span className="text-[11px] font-bold text-rose-600 mt-1 block">{errors.email}</span>}
            {!form.emailVerified && (
              <button type="button" onClick={resendVerify} className="mt-2 text-[11px] font-black text-[#3083ff]">
                Resend verification
              </button>
            )}
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Preferred city</span>
            <select className={`${inputClass} mt-1.5`} value={form.preferredCity} onChange={(e) => set('preferredCity', e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Preferred brands</p>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => toggleTag('preferredBrands', b.name)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black border ${
                    form.preferredBrands.includes(b.name) ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {b.name}
                </button>
              ))}
              {brands.length === 0 && <p className="text-xs font-semibold text-slate-400">No brands in catalogue yet.</p>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Preferred models</p>
            <div className="flex flex-wrap gap-2">
              {models.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => toggleTag('preferredModels', m.name)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black border ${
                    form.preferredModels.includes(m.name) ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {m.name}
                </button>
              ))}
              {form.preferredBrands.length > 0 && models.length === 0 && (
                <p className="text-xs font-semibold text-slate-400">No models for the selected brands yet.</p>
              )}
            </div>
          </div>
          {priceRange && (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Budget range · {budgetLabel}</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={10000}
                  value={form.budgetMin === '' ? sliderMin : form.budgetMin}
                  onChange={(e) => set('budgetMin', Number(e.target.value))}
                />
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={10000}
                  value={form.budgetMax === '' ? sliderMax : form.budgetMax}
                  onChange={(e) => set('budgetMax', Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <button disabled={saving} className="sm:col-span-2 bg-[#3083ff] text-white font-black rounded-2xl py-3">
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </form>
      </ProfileCard>

      <ProfileCard eyebrow="Address book" title="Saved addresses">
        {addresses.length === 0 && <EmptyNote>No addresses saved.</EmptyNote>}
        <div className="space-y-3 mb-5">
          {addresses.map((a) => (
            <div key={a._id} className="rounded-2xl border border-slate-100 px-4 py-3 flex justify-between gap-3">
              <div>
                <p className="font-black text-slate-900 text-sm">{a.label || 'Address'}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
              <button type="button" onClick={() => removeAddress(a._id)} className="text-[11px] font-black text-rose-600">
                Remove
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addAddress} className="grid sm:grid-cols-2 gap-3">
          <input className={inputClass} value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} aria-label="Label" />
          <input className={inputClass} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} aria-label="Address line 1" required />
          <input className={inputClass} value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} aria-label="Address line 2" />
          <input className={inputClass} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} aria-label="City" required />
          <input className={inputClass} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} aria-label="State" />
          <input className={inputClass} value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} aria-label="Pincode" />
          <button className="sm:col-span-2 border border-slate-200 font-black rounded-2xl py-3 text-sm">Add address</button>
        </form>
      </ProfileCard>
    </div>
  );
}
