import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../api/axios';
import { fetchMe, updateProfile } from '../../app/authSlice';
import PasswordField from '../../components/PasswordField';
import { emailError } from '../../lib/kycValidation';
import { Building2, Hash, Lock, Mail, MapPin, ShieldCheck, User } from 'lucide-react';
import AccountAvatar from '../../components/AccountAvatar';
import { GlassCard, PageHeader, btnPrimary, inputCls } from '../../components/dealer/ui';

function isStrongPassword(password) {
  const value = String(password || '');
  return value.length >= 8 && value.length <= 12;
}

export default function DealerSettings() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', dealershipName: '', city: '', email: '' });
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const load = async () => {
    const me = await dispatch(fetchMe());
    const live = me.payload?.user || {};
    let nextProfile = null;
    try {
      const { data } = await api.get('/dealer/onboarding');
      nextProfile = data.data?.profile || null;
      setProfile(nextProfile);
    } catch {
      setProfile(null);
    }
    setForm({
      name: live.name || nextProfile?.contactPerson || '',
      dealershipName: live.dealershipName || nextProfile?.businessName || '',
      city: live.city || nextProfile?.city || '',
      email: live.email || nextProfile?.contactEmail || '',
    });
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    const mailErr = emailError(form.email) || (!String(form.email || '').trim() ? 'Email is required' : '');
    if (mailErr) {
      toast.error(mailErr);
      return;
    }
    setSaving(true);
    const res = await dispatch(updateProfile({
      ...form,
      email: String(form.email).trim().toLowerCase(),
    }));
    setSaving(false);
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Profile updated');
      dispatch(fetchMe());
    } else {
      toast.error(res.payload || 'Could not save profile');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pass.currentPassword || !pass.newPassword) {
      toast.error('Enter current and new password');
      return;
    }
    if (pass.newPassword !== pass.confirm) {
      toast.error('New password and confirm do not match');
      return;
    }
    if (!isStrongPassword(pass.newPassword)) {
      toast.error('New password must be 8–12 characters');
      return;
    }
    setSavingPass(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pass.currentPassword,
        newPassword: pass.newPassword,
      });
      toast.success('Password updated');
      setPass({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSavingPass(false);
    }
  };

  const live = user || {};
  const kyc = profile?.kycStatus || live.kycStatus || 'pending';

  return (
    <div className="space-y-6">
      <div className="-mx-3 -mt-3 flex items-center gap-3 bg-[#3083ff] px-4 py-5 text-white lg:hidden">
        <AccountAvatar user={live} tone="white" className="h-14 w-14 text-[20px]" />
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold">{live.dealershipName || live.name || 'Showroom'}</p>
          <p className="truncate text-[12px] text-white/80">{live.dealerCode || 'Dealer ID pending'}</p>
          <p className="mt-1 text-[12px] text-white/80">KYC {kyc}</p>
        </div>
      </div>
      <div className="hidden lg:block">
      <PageHeader kicker="Account" title="Dealer profile & settings" subtitle="Showroom identity and login security." />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        {[
          ['Dealer ID', live.dealerCode || '—', 'from-[#b7d9f8] to-[#dceefc]', Hash],
          ['KYC', kyc, 'from-[#b4e8d0] to-[#d8f5e8]', ShieldCheck],
          ['Name', live.name || '—', 'from-[#ffe09a] to-[#fff0c8]', User],
          ['Company', live.dealershipName || profile?.businessName || '—', 'from-[#d9c6f6] to-[#eee4fc]', Building2],
        ].map(([label, value, tone, Icon]) => (
          <div key={label} className={`rounded-[20px] border border-white bg-gradient-to-b ${tone} p-3`}>
            <p className="inline-flex items-center gap-1.5 text-[12px] font-normal text-slate-600">
              <Icon className="h-3.5 w-3.5" /> {label}
            </p>
            <p className="mt-1 truncate text-[14px] font-medium text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <GlassCard className="p-4 sm:p-5">
        <div className="mb-6 hidden gap-3 sm:grid-cols-2 lg:grid">
          <Info label="Dealer ID" value={live.dealerCode || '—'} mono />
          <Info label="KYC" value={kyc} />
          <Info label="Name" value={live.name || '—'} />
          <Info label="Company" value={live.dealershipName || profile?.businessName || '—'} />
        </div>
        <form onSubmit={saveProfile} className="max-w-md space-y-3 lg:space-y-4" autoComplete="off">
          <Field label="Contact name" icon={User}>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Company / dealership" icon={Building2}>
            <input className={inputCls} value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} />
          </Field>
          <Field label="City" icon={MapPin}>
            <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Email" icon={Mail}>
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="dealer@showroom.com"
              autoComplete="email"
            />
          </Field>
          <button type="submit" disabled={saving} className={`${btnPrimary} w-full lg:w-auto`}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <h2 className="mb-3 inline-flex items-center gap-1.5 text-[16px] font-semibold text-slate-900">
          <Lock className="h-4 w-4 text-[#3083ff]" /> Password
        </h2>
        <form onSubmit={savePassword} className="max-w-md space-y-4" autoComplete="off">
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={pass.currentPassword}
            inputClassName={inputCls}
            onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            maxLength={12}
            value={pass.newPassword}
            inputClassName={inputCls}
            onChange={(e) => setPass({ ...pass, newPassword: e.target.value })}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            maxLength={12}
            value={pass.confirm}
            inputClassName={inputCls}
            onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
          />
          <p className="text-xs font-semibold text-slate-500">Must be 8–12 characters. Shorter than 8 is not accepted.</p>
          <button type="submit" disabled={savingPass} className={`${btnPrimary} w-full lg:w-auto`}>
            {savingPass ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
        {Icon ? <Icon className="h-3.5 w-3.5 text-[#3083ff]" /> : null}
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Info({ label, value, mono }) {
  return (
    <div className="bg-white px-4 py-3 lg:rounded-2xl lg:border lg:border-slate-100 lg:bg-slate-50">
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-[14px] font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
