import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import AuthShell from './AuthShell';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState({ loading: true, message: '', ok: false });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, ok: false, message: 'Verification token is missing' });
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then((r) => setState({ loading: false, ok: true, message: r.data.message || 'Email verified' }))
      .catch((e) => setState({ loading: false, ok: false, message: e.response?.data?.message || 'Could not verify email' }));
  }, [token]);

  return (
    <AuthShell title="Email verification">
      <p className={`text-sm font-semibold ${state.ok ? 'text-emerald-600' : 'text-slate-600'}`}>
        {state.loading ? 'Checking your link…' : state.message}
      </p>
      <Link to="/customer/login" className="inline-block mt-6 bg-[#3083ff] text-white font-black rounded-2xl px-5 py-3 text-sm">
        Continue to sign in
      </Link>
    </AuthShell>
  );
}
