import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { emailError, inputClass } from '../../lib/kycValidation';
import AuthShell from './AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const err = emailError(email) || (!email ? 'Email is required' : '');
    if (err) return toast.error(err);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResetUrl(data.resetUrl || '');
      toast.success(data.message || 'Reset link issued');
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Could not start reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We’ll issue a time-limited reset token for this email.">
      <form onSubmit={submit} className="space-y-4">
        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        <button disabled={loading} className="w-full bg-[#3083ff] text-white font-black rounded-2xl py-3.5">{loading ? 'Sending…' : 'Send reset link'}</button>
        {resetUrl && (
          <p className="text-xs font-semibold text-slate-600 break-all">
            Dev reset link: <Link to={resetUrl.replace(window.location.origin, '')} className="text-[#3083ff]">{resetUrl}</Link>
          </p>
        )}
        <p className="text-center text-sm font-semibold text-slate-500">
          <Link to="/customer/login" className="text-[#3083ff] font-black">Back to sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
