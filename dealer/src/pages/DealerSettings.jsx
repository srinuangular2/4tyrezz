import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { fetchMe, updateProfile } from '../app/authSlice';
import PasswordField from '../components/PasswordField';
import { inputClass } from '../lib/kycValidation';
import { ProfileCard } from '../components/ui';

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
    setForm({
      name: live.name || '',
      dealershipName: live.dealershipName || '',
      city: live.city || '',
      email: live.email || '',
    });
    try {
      const { data } = await api.get('/dealer/onboarding');
      setProfile(data.data?.profile || null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await dispatch(updateProfile(form));
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
      <ProfileCard eyebrow="Account" title="Dealer profile & settings">
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <Info label="Dealer ID" value={live.dealerCode || '—'} mono />
          <Info label="KYC" value={kyc} />
          <Info label="Name" value={live.name || '—'} />
          <Info label="Company" value={live.dealershipName || profile?.businessName || '—'} />
        </div>
        <form onSubmit={saveProfile} className="max-w-md space-y-4" autoComplete="off">
          <Field label="Contact name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Company / dealership">
            <input className={inputClass} value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} />
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Email">
            <input disabled className={`${inputClass} bg-slate-50`} value={form.email || 'Add during KYC'} />
          </Field>
          <button type="submit" disabled={saving} className="bg-[#3083ff] text-white font-black rounded-2xl px-5 py-3 text-sm">
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </ProfileCard>

      <ProfileCard eyebrow="Security" title="Change password">
        <form onSubmit={savePassword} className="max-w-md space-y-4" autoComplete="off">
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={pass.currentPassword}
            onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            maxLength={12}
            value={pass.newPassword}
            onChange={(e) => setPass({ ...pass, newPassword: e.target.value })}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            maxLength={12}
            value={pass.confirm}
            onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
          />
          <p className="text-xs font-semibold text-slate-500">Must be 8–12 characters. Shorter than 8 is not accepted.</p>
          <button type="submit" disabled={savingPass} className="bg-slate-900 text-white font-black rounded-2xl px-5 py-3 text-sm">
            {savingPass ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </ProfileCard>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Info({ label, value, mono }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-sm font-bold text-slate-900 mt-1 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
