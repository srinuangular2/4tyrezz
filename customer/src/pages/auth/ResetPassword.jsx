import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { inputClass, passwordError, passwordStrength } from '../../lib/kycValidation';
import AuthShell from './AuthShell';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => passwordStrength(password), [password]);

  const submit = async (e) => {
    e.preventDefault();
    const err = passwordError(password);
    if (err || !token) return toast.error(err || 'Reset token is missing');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated');
      navigate('/customer/login', { replace: true });
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {password && <p className="text-[11px] font-bold text-slate-500">{strength.label}</p>}
        <button disabled={loading} className="w-full bg-[#3083ff] text-white font-black rounded-2xl py-3.5">{loading ? 'Saving…' : 'Update password'}</button>
        <Link to="/customer/login" className="block text-center text-sm font-black text-[#3083ff]">Sign in</Link>
      </form>
    </AuthShell>
  );
}
