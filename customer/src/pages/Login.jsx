import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthFlow from '../components/AuthFlow';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/profile/settings';

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #3083ff22 0%, transparent 50%)' }} />
      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="hidden lg:block">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#3083ff]">Customer access</p>
            <h1 className="font-display text-4xl font-black text-slate-900 tracking-tight mt-3 leading-tight">
              One number. Four digits. You’re in.
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-4 max-w-md leading-relaxed">
              OTP is 4 digits. In local development we skip Msg91 — use the on-screen helper or the backend terminal.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Save inspected cars to your wishlist',
                'Talk to 4tyrezz before you buy',
                'Finance and insurance desk on the same account',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-[#3083ff] text-white flex items-center justify-center text-[11px]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_20px_40px_0_rgba(48,131,255,0.12)] p-7 sm:p-9">
            <AuthFlow variant="page" onSuccess={() => navigate(redirectTo, { replace: true })} />
            <p className="text-center text-sm font-semibold text-slate-500 mt-6">
              Prefer email?{' '}
              <Link to="/customer/login" className="text-[#3083ff] font-black hover:underline">Sign in</Link>
              {' · '}
              <Link to="/customer/register" className="text-[#3083ff] font-black hover:underline">Create account</Link>
            </p>
            <p className="text-center text-sm font-semibold text-slate-500 mt-3">
              Dealer or showroom?{' '}
              <Link to="/dealer/login" className="text-[#3083ff] font-black hover:underline">Sign in with Dealer ID</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
