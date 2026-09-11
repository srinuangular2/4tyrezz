import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  requestOtp,
  verifyOtp,
  completeProfile,
  connectGoogle,
  skipProfile,
  clearAuthError,
} from '../app/authSlice';
import { Close } from './icons';
import DevOtpHint from './DevOtpHint';
import toast from 'react-hot-toast';

const OTP_LEN = 4;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthFlow({ onClose, onSuccess, variant = 'modal' }) {
  const dispatch = useDispatch();
  const { error, token, devOtp } = useSelector((s) => s.auth);

  const [view, setView] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LEN).fill(''));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [view, dispatch]);

  const handleGoogleCredential = useCallback(async (response) => {
    setLoading(true);
    const res = await dispatch(connectGoogle({ credential: response.credential }));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') {
      onSuccess?.();
      onClose?.();
    }
  }, [dispatch, onSuccess, onClose]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || view !== 'profile') return undefined;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      const btn = document.getElementById('google-signin-btn');
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        });
      }
    };
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, [view, handleGoogleCredential]);

  const finish = () => {
    onSuccess?.();
    onClose?.();
  };

  const sendOtp = async (e) => {
    e?.preventDefault();
    dispatch(clearAuthError());
    setLoading(true);
    const res = await dispatch(requestOtp(mobile));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') {
      setView('otp');
      setResendIn(30);
      setOtpDigits(Array(OTP_LEN).fill(''));
      const code = res.payload.devOtp;
      if (code) {
        toast.success(`Dev Mode: Your OTP for +91 ${res.payload.mobile || mobile} is ${code}`, { duration: 8000 });
      }
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  };

  const otpValue = otpDigits.join('');

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!pasted) return;
    const next = pasted.split('').concat(Array(OTP_LEN).fill('')).slice(0, OTP_LEN);
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus();
  };

  const confirmOtp = async (e) => {
    e.preventDefault();
    if (otpValue.length !== OTP_LEN) return;
    dispatch(clearAuthError());
    setLoading(true);
    const res = await dispatch(verifyOtp({ mobile, otp: otpValue }));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') {
      if (res.payload.needsProfile) setView('profile');
      else finish();
    }
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await dispatch(completeProfile({ name, email }));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') finish();
  };

  const handleSkip = async () => {
    if (!token) return finish();
    setLoading(true);
    const res = await dispatch(skipProfile());
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') finish();
  };

  const titles = {
    mobile: ['Sign in to 4TYREZZ', 'Enter your mobile number. We’ll send a 4-digit OTP over SMS and WhatsApp.'],
    otp: ['Verify your number', `Enter the 4-digit code sent to +91 ${mobile}`],
    profile: ['A few details', 'Optional — helps dealers and our finance desk reach you by name.'],
  };

  const shellClass = variant === 'page'
    ? 'w-full'
    : 'relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/70 rounded-3xl p-7 shadow-[0_20px_40px_0_rgba(48,131,255,0.16)] animate-fadeUp';

  const content = (
    <div className={shellClass}>
      {onClose && (
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 z-10">
          <Close />
        </button>
      )}

      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3083ff] mb-2">Welcome</p>
      <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        {titles[view][0]}
      </h2>
      <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">{titles[view][1]}</p>

      {view === 'mobile' && (
        <form onSubmit={sendOtp} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Mobile number</span>
            <div className="mt-1.5 flex rounded-2xl overflow-hidden border border-slate-200 focus-within:border-[#3083ff] focus-within:ring-4 focus-within:ring-[#3083ff]/10 transition bg-white">
              <span className="px-4 py-3.5 bg-slate-50 text-sm font-black text-slate-800 border-r border-slate-200">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="flex-1 px-4 py-3.5 text-base font-extrabold outline-none tracking-wide"
              />
            </div>
          </label>
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || mobile.length !== 10}
            className="w-full bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
          <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
            By continuing you agree to our Terms and Privacy Policy. OTP is 4 digits and expires in 5 minutes.
          </p>
        </form>
      )}

      {view === 'otp' && (
        <form onSubmit={confirmOtp} className="mt-7 space-y-5">
          <DevOtpHint code={devOtp} mobile={mobile} />
          <div onPaste={handleOtpPaste} className="flex justify-center gap-3">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-14 h-16 text-center text-2xl font-black border border-slate-200 rounded-2xl bg-white focus:border-[#3083ff] focus:ring-4 focus:ring-[#3083ff]/10 outline-none transition"
              />
            ))}
          </div>
          {error && <p className="text-sm font-semibold text-rose-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || otpValue.length !== OTP_LEN}
            className="w-full bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <div className="flex items-center justify-between text-sm font-bold">
            <button type="button" onClick={() => setView('mobile')} className="text-slate-500 hover:text-slate-900">
              Change number
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={resendIn > 0 || loading}
              className="text-[#3083ff] disabled:text-slate-400"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}

      {view === 'profile' && (
        <div className="mt-7 space-y-5">
          {GOOGLE_CLIENT_ID && (
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/80">
              <div id="google-signin-btn" className="flex justify-center" />
            </div>
          )}
          <form onSubmit={submitProfile} className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-extrabold outline-none focus:border-[#3083ff] focus:ring-4 focus:ring-[#3083ff]/10"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-extrabold outline-none focus:border-[#3083ff] focus:ring-4 focus:ring-[#3083ff]/10"
            />
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </form>
          <button type="button" onClick={handleSkip} disabled={loading} className="w-full text-sm font-bold text-slate-500 hover:text-slate-900 py-2">
            Skip for now
          </button>
        </div>
      )}
    </div>
  );

  if (variant === 'page') return content;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{content}</div>
    </div>
  );
}
