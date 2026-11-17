import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Camera, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { emailError, inputClass, mobileError, PINCODE_REGEX } from '../../lib/kycValidation';
import { fetchMe } from '../../app/authSlice';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { compressImage, mediaUrl } from './hubUtils';

const blankAddress = { label: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

function BrandIcon({ name, logo, small = false }) {
  const [failed, setFailed] = useState(false);
  const src = logo && !failed ? mediaUrl(logo) : '';
  return (
    <span className={`${small ? 'w-5 h-5 rounded-full' : 'w-9 h-9 rounded-xl'} bg-white border border-slate-100 inline-flex items-center justify-center overflow-hidden shrink-0`}>
      {src ? (
        <img src={src} alt="" className="h-[72%] w-[72%] object-contain" onError={() => setFailed(true)} />
      ) : (
        <span className={`${small ? 'text-[9px]' : 'text-[11px]'} font-black text-[#3083ff]`}>{String(name || '?').slice(0, 1)}</span>
      )}
    </span>
  );
}

const rangeThumb = 'pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#3083ff] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(48,131,255,0.35)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#3083ff]';

function SearchDropdown({ label, placeholder, query, onQuery, options, selected, onToggle, empty, disabled }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <button key={item} type="button" onClick={() => onToggle(item)} className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[12px] font-semibold text-[#1853ff]">
              {item}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-[13px] font-medium text-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <span className="inline-flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          {placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={placeholder}
              className="h-10 w-full rounded-xl bg-[#f4f7fb] px-3 text-[13px] font-medium text-slate-800 outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {options.map((option) => {
              const on = selected.includes(option.value);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onToggle(option.value)}
                  className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 ${on ? 'bg-[#f3f8ff]' : 'hover:bg-slate-50'}`}
                >
                  {option.logo !== undefined ? <BrandIcon name={option.label} logo={option.logo} /> : null}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[13px] font-semibold ${on ? 'text-[#1853ff]' : 'text-slate-800'}`}>{option.label}</span>
                    {option.hint ? <span className="block truncate text-[11px] text-slate-400">{option.hint}</span> : null}
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${on ? 'border-[#3083ff] bg-[#3083ff] text-white' : 'border-slate-200 text-transparent'}`}>✓</span>
                </button>
              );
            })}
            {options.length === 0 && <p className="px-3 py-4 text-[13px] text-slate-400">{empty}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [brandQuery, setBrandQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');

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
    Promise.all(ids.map((id) => api.get('/models', { params: { brand: id } }).then((r) => {
      const brandName = brands.find((b) => b._id === id)?.name || '';
      const rows = Array.isArray(r.data) ? r.data : r.data?.data || [];
      return rows.map((model) => ({ ...model, brandName }));
    })))
      .then((groups) => setModels(groups.flat()))
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
  const initial = (form.name || 'U').trim().charAt(0).toUpperCase() || 'U';
  const visibleBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    return brands.filter((b) => !q || String(b.name || '').toLowerCase().includes(q));
  }, [brands, brandQuery]);
  const visibleModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    return models.filter((m) => !q || String(m.name || '').toLowerCase().includes(q));
  }, [models, modelQuery]);

  const fieldLabel = 'text-[12px] font-medium text-slate-500';

  return (
    <>
    <div className="lg:hidden space-y-4">
      {verifyUrl && (
        <p className="text-xs font-semibold text-slate-600 break-all bg-white rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] px-4 py-3">
          Verify email: <a href={verifyUrl} className="text-[#3083ff] font-black">{verifyUrl}</a>
        </p>
      )}

      <section className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(15,23,42,0.08)] p-4 flex items-center gap-4">
        <label className="relative shrink-0 cursor-pointer">
          <span className="w-[72px] h-[72px] rounded-full bg-[#eaf2ff] overflow-hidden flex items-center justify-center text-2xl font-black text-[#3083ff]">
            {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : initial}
          </span>
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#3083ff] text-white inline-flex items-center justify-center shadow">
            <Camera className="w-3.5 h-3.5" />
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </label>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-900 truncate">{form.name || 'Your name'}</p>
          <p className="text-[12px] font-normal text-slate-500 truncate mt-0.5">{form.mobile || 'Mobile not added'}</p>
          <p className={`text-[11px] font-black mt-1 ${form.emailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
            {form.emailVerified ? 'Email verified' : 'Email not verified'}
          </p>
        </div>
      </section>

      <form onSubmit={saveProfile} className="space-y-4">
        <section className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(15,23,42,0.08)] p-4 space-y-3">
          <p className="text-[14px] font-semibold text-slate-900">Personal details</p>
          <label className="block">
            <span className={fieldLabel}>Full name</span>
            <input className={`${inputClass} mt-1.5`} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" />
          </label>
          <label className="block">
            <span className={fieldLabel}>Mobile {form.mobileVerified ? '· verified' : ''}</span>
            <input className={`${inputClass} mt-1.5`} value={form.mobile} disabled />
          </label>
          <label className="block">
            <span className={fieldLabel}>Email {form.emailVerified ? '· verified' : '· unverified'}</span>
            <input className={`${inputClass} mt-1.5`} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@email.com" />
            {errors.email && <span className="text-[11px] font-bold text-rose-600 mt-1 block">{errors.email}</span>}
            {!form.emailVerified && (
              <button type="button" onClick={resendVerify} className="mt-2 text-[12px] font-black text-[#3083ff]">
                Resend verification
              </button>
            )}
          </label>
        </section>

        <section className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(15,23,42,0.08)] p-4 space-y-4">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Buying preferences</p>
            <p className="text-[12px] font-normal text-slate-500 mt-0.5">Used to match cars and alerts.</p>
          </div>
          <label className="block">
            <span className={fieldLabel}>Preferred city</span>
            <select className={`${inputClass} mt-1.5`} value={form.preferredCity} onChange={(e) => set('preferredCity', e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>

          <SearchDropdown
            label="Preferred brands"
            placeholder="Search brands"
            query={brandQuery}
            onQuery={setBrandQuery}
            selected={form.preferredBrands}
            onToggle={(name) => toggleTag('preferredBrands', name)}
            empty={brands.length ? 'No matching brands.' : 'No brands in the catalogue yet.'}
            options={visibleBrands.map((brand) => ({
              id: brand._id,
              value: brand.name,
              label: brand.name,
              logo: brand.logo,
            }))}
          />
          {form.preferredBrands.length > 0 && (
            <SearchDropdown
              label="Preferred models"
              placeholder="Search models"
              query={modelQuery}
              onQuery={setModelQuery}
              selected={form.preferredModels}
              onToggle={(name) => toggleTag('preferredModels', name)}
              empty="No models for the selected brands."
              options={visibleModels.map((model) => ({
                id: model._id,
                value: model.name,
                label: model.name,
                hint: model.brandName,
              }))}
            />
          )}

          {priceRange && (
            <div className="rounded-2xl bg-slate-50 px-3.5 py-3.5">
              <p className={fieldLabel}>Budget range</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">From</p>
                  <p className="text-[13px] font-semibold text-slate-900">{formatINR(form.budgetMin === '' ? sliderMin : form.budgetMin)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium text-slate-400">To</p>
                  <p className="text-[13px] font-bold text-[#1853ff]">{formatINR(form.budgetMax === '' ? sliderMax : form.budgetMax)}</p>
                </div>
              </div>
              <div className="relative h-8 mt-3">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-slate-200" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[#3083ff]"
                  style={{
                    left: `${((Number(form.budgetMin === '' ? sliderMin : form.budgetMin) - sliderMin) / Math.max(1, sliderMax - sliderMin)) * 100}%`,
                    right: `${100 - ((Number(form.budgetMax === '' ? sliderMax : form.budgetMax) - sliderMin) / Math.max(1, sliderMax - sliderMin)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  className={rangeThumb}
                  min={sliderMin}
                  max={sliderMax}
                  step={10000}
                  value={form.budgetMin === '' ? sliderMin : form.budgetMin}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    const cap = Number(form.budgetMax === '' ? sliderMax : form.budgetMax);
                    set('budgetMin', Math.min(next, cap));
                  }}
                />
                <input
                  type="range"
                  className={rangeThumb}
                  min={sliderMin}
                  max={sliderMax}
                  step={10000}
                  value={form.budgetMax === '' ? sliderMax : form.budgetMax}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    const floor = Number(form.budgetMin === '' ? sliderMin : form.budgetMin);
                    set('budgetMax', Math.max(next, floor));
                  }}
                />
              </div>
            </div>
          )}

          <button disabled={saving} className="w-full bg-[#3083ff] text-white font-black rounded-2xl py-3.5">
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </section>
      </form>

      <section className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(15,23,42,0.08)] p-4 space-y-3">
        <div>
          <p className="text-[14px] font-semibold text-slate-900">Saved addresses</p>
          <p className="text-[12px] font-normal text-slate-500 mt-0.5">Used for test drives and delivery.</p>
        </div>
        {addresses.length === 0 && <p className="text-[13px] font-semibold text-slate-400">No addresses saved yet.</p>}
        {addresses.map((a) => (
          <div key={a._id} className="rounded-2xl bg-slate-50 px-3 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">{a.label || 'Address'}</p>
              <p className="text-[12px] font-normal text-slate-500 mt-0.5">
                {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
            <button type="button" onClick={() => removeAddress(a._id)} className="text-[12px] font-black text-rose-600 shrink-0">Remove</button>
          </div>
        ))}
        <form onSubmit={addAddress} className="space-y-2 pt-1">
          <input className={inputClass} value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Label, e.g. Home" />
          <input className={inputClass} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder="Address line 1" required />
          <input className={inputClass} value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} placeholder="Address line 2" />
          <input className={inputClass} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="City" required />
          <input className={inputClass} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} placeholder="State" />
          <input className={inputClass} value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="Pincode" inputMode="numeric" />
          <button className="w-full border border-[#3083ff] text-[#3083ff] font-black rounded-2xl py-3 text-sm">Add address</button>
        </form>
      </section>
    </div>

    <div className="hidden lg:block space-y-6">
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
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#eef5ff] px-4 text-[13px] font-semibold text-[#1853ff]">
              <Camera className="h-4 w-4" />
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>
          <label className="block">
            <span className="text-[12px] font-medium text-slate-500">Full name</span>
            <input className={`${inputClass} mt-1.5`} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-slate-500">
              Mobile {form.mobileVerified ? '· verified' : ''}
            </span>
            <input className={`${inputClass} mt-1.5`} value={form.mobile} disabled />
            {errors.mobile && <span className="text-[11px] font-bold text-rose-600 mt-1 block">{errors.mobile}</span>}
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[12px] font-medium text-slate-500">
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
            <span className="text-[12px] font-medium text-slate-500">Preferred city</span>
            <select className={`${inputClass} mt-1.5`} value={form.preferredCity} onChange={(e) => set('preferredCity', e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <SearchDropdown
              label="Preferred brands"
              placeholder="Search brands"
              query={brandQuery}
              onQuery={setBrandQuery}
              selected={form.preferredBrands}
              onToggle={(name) => toggleTag('preferredBrands', name)}
              empty={brands.length ? 'No matching brands.' : 'No brands in the catalogue yet.'}
              options={visibleBrands.map((brand) => ({
                id: brand._id,
                value: brand.name,
                label: brand.name,
                logo: brand.logo,
              }))}
            />
          </div>
          <div className="sm:col-span-2">
            <SearchDropdown
              label="Preferred models"
              placeholder={form.preferredBrands.length ? 'Search models' : 'Choose a brand first'}
              query={modelQuery}
              onQuery={setModelQuery}
              selected={form.preferredModels}
              onToggle={(name) => toggleTag('preferredModels', name)}
              disabled={!form.preferredBrands.length}
              empty={form.preferredBrands.length ? 'No models for the selected brands.' : 'Choose a brand first.'}
              options={visibleModels.map((model) => ({
                id: model._id,
                value: model.name,
                label: model.name,
                hint: model.brandName,
              }))}
            />
          </div>
          {priceRange && (
            <div className="sm:col-span-2">
              <p className="text-[12px] font-medium text-slate-500">Budget range · {budgetLabel}</p>
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
          <button disabled={saving} className="h-12 rounded-2xl bg-[#3083ff] text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(48,131,255,0.28)] sm:col-span-2">
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
                <p className="text-[14px] font-semibold text-slate-900">{a.label || 'Address'}</p>
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
          <input className={inputClass} value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Label" aria-label="Label" />
          <input className={inputClass} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder="Address line 1" aria-label="Address line 1" required />
          <input className={inputClass} value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} placeholder="Address line 2" aria-label="Address line 2" />
          <input className={inputClass} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="City" aria-label="City" required />
          <input className={inputClass} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} placeholder="State" aria-label="State" />
          <input className={inputClass} value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="Pincode" aria-label="Pincode" />
          <button className="h-12 rounded-2xl border border-slate-200 text-[14px] font-semibold text-slate-800 sm:col-span-2">Add address</button>
        </form>
      </ProfileCard>
    </div>
    </>
  );
}
