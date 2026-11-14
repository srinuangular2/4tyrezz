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
const AUTH_STEPS = [
  { id: 'mobile', label: 'Number' },
  { id: 'otp', label: 'Code' },
  { id: 'profile', label: 'Name' },
];

export default function AuthFlow({ onClose, onSuccess, variant = 'modal', showClose, locked = false }) {
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
      if (!locked) onClose?.();
    }
  }, [dispatch, onSuccess, onClose, locked]);

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
    if (!locked) onClose?.();
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
        toast.success(`Code for +91 ${res.payload.mobile || mobile}: ${code}`, { duration: 8000 });
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
    mobile: ['Enter your mobile number', 'We send a 4-digit code by SMS. It expires in 5 minutes.'],
    otp: ['Enter the code', `Sent to +91 ${mobile}`],
    profile: ['Add your name', 'Optional. We use it when we contact you about a car.'],
  };
  const stepIndex = Math.max(0, AUTH_STEPS.findIndex((item) => item.id === view));

  const shellClass = variant === 'embed' || variant === 'page'
    ? 'relative w-full text-slate-900'
    : 'relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 animate-fadeUp max-h-[90vh] overflow-y-auto';
  const shellStyle = variant === 'modal'
    ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22)' }
    : undefined;
  const canClose = !locked && (showClose ?? Boolean(onClose));

  const content = (
    <div className={shellClass} style={shellStyle}>
      {variant === 'modal' && (
        <div className="sm:hidden flex justify-center -mt-1 mb-3">
          <span className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>
      )}
      {canClose && (
        <button type="button" onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 flex items-center justify-center z-10" aria-label="Close">
          <Close />
        </button>
      )}

      {variant !== 'embed' && (
        <div className="mb-4 flex items-center gap-2 pr-10">
          {AUTH_STEPS.map((item, index) => {
            const on = index === stepIndex;
            const done = index < stepIndex;
            return (
              <div key={item.id} className="flex min-w-0 items-center gap-1.5">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${on || done ? 'bg-[#3083ff] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {index + 1}
                </span>
                <span className={`truncate text-[12px] font-medium ${on ? 'text-slate-900' : 'text-slate-400'}`}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
      <h2 id="customer-login-title" className="pr-10 font-display text-[22px] font-semibold tracking-tight text-slate-900">
        {titles[view][0]}
      </h2>
      <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-slate-500">
        {locked && view === 'mobile' ? 'Sign in to view this car. It stays open after your number is verified.' : titles[view][1]}
      </p>

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
          <div onPaste={handleOtpPaste} className="flex justify-center gap-2.5">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                className="h-14 w-12 rounded-2xl border border-slate-200 bg-white text-center text-[22px] font-semibold outline-none transition focus:border-[#3083ff] focus:ring-4 focus:ring-[#3083ff]/10"
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
            <label className="block">
              <span className="text-[12px] font-medium text-slate-600">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#3083ff] focus:ring-4 focus:ring-[#3083ff]/10"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-medium text-slate-600">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#3083ff] focus:ring-4 focus:ring-[#3083ff]/10"
              />
            </label>
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition"
            >
              {loading ? 'Saving…' : 'Save and continue'}
            </button>
          </form>
          <button type="button" onClick={handleSkip} disabled={loading} className="w-full py-2 text-[13px] font-semibold text-slate-500">
            Skip for now
          </button>
        </div>
      )}
      {locked && (
        <button type="button" onClick={onClose} className="mt-4 w-full py-2 text-[13px] font-semibold text-slate-500">
          Back to used cars
        </button>
      )}
    </div>
  );

  if (variant === 'page' || variant === 'embed') return content;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
      <div
        role="presentation"
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.52)' }}
        onClick={locked ? undefined : onClose}
      />
      <div className="relative z-10 max-h-[100dvh] w-full overflow-y-auto sm:w-auto" onClick={(e) => e.stopPropagation()}>{content}</div>
    </div>
  );
}
