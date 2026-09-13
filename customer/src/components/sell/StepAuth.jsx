import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { requestOtp, verifyOtp } from '../../app/authSlice';
import { formatINR } from '../PageShell';
import { HUBS, monthLabel } from './sellCarState';
import { sellFieldClass } from './ui';
import DevOtpHint from '../DevOtpHint';
import toast from 'react-hot-toast';

const OTP_LEN = 4;

export default function StepAuth({ state, patch, submitting, onBack, onConfirm }) {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const [otpOpen, setOtpOpen] = useState(false);
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''));
  const [sending, setSending] = useState(false);
  const refs = useRef([]);
  const otpValue = digits.join('');

  useEffect(() => {
    if (auth.user?.mobile && !state.phone) {
      patch({
        phone: auth.user.mobile,
        name: auth.user.name || state.name,
        email: auth.user.email || state.email,
        otpVerified: true,
      });
    }
  }, [auth.user, patch, state.name, state.phone]);

  const send = async () => {
    if (!/^[0-9]{10}$/.test(state.phone)) return;
    setSending(true);
    const res = await dispatch(requestOtp(state.phone));
    setSending(false);
    if (res.meta.requestStatus === 'fulfilled') {
      setOtpOpen(true);
      setDigits(Array(OTP_LEN).fill(''));
      const code = res.payload.devOtp;
      if (code) {
        toast.success(`Dev Mode: Your OTP for +91 ${res.payload.mobile || state.phone} is ${code}`, { duration: 8000 });
      }
      setTimeout(() => refs.current[0]?.focus(), 80);
    }
  };

  const confirmOtp = async (e) => {
    e?.preventDefault();
    if (otpValue.length !== OTP_LEN) return;
    setSending(true);
    const res = await dispatch(verifyOtp({ mobile: state.phone, otp: otpValue }));
    setSending(false);
    if (res.meta.requestStatus === 'fulfilled') {
      patch({ otpVerified: true, name: state.name || res.payload.user?.name || '' });
      setOtpOpen(false);
    }
  };

  const hub = HUBS.find((h) => h.id === state.hubId);
  const ready = state.otpVerified && state.name && state.phone;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Step 4</p>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">Confirm booking</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">Verify your mobile, then lock the inspection. Final offer comes after inspection.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
        <Row k="Car" v={`${state.year} ${state.brand} ${state.model}${state.variant ? ` · ${state.variant}` : ''}`} />
        <Row k="Intent" v={state.intent === 'exchange' ? 'Exchange' : state.intent === 'both' ? 'Sell & exchange' : 'Sell'} />
        <Row k="Plate" v={state.plate || '—'} />
        <Row k="Estimate" v={state.valuation ? `${formatINR(state.valuation.minPrice)} – ${formatINR(state.valuation.maxPrice)}` : 'Pending inspection'} />
        <Row k="Your expectation" v={state.expectedPrice ? formatINR(Number(state.expectedPrice)) : '—'} />
        <Row
          k="Inspection"
          v={`${state.inspectionType === 'hub' ? hub?.name || 'Hub' : 'Home'} · ${state.inspectionDate} · ${state.inspectionSlot}`}
        />
        <Row k="Registered" v={`${monthLabel(state.month)} ${state.year} · ${state.city || '—'}`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Full name</span>
          <input
            value={state.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Your name"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Mobile</span>
          <div className="mt-1.5 flex rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm focus-within:border-[#3083ff] focus-within:ring-2 focus-within:ring-[#3083ff]/20">
            <span className="px-3 py-3 bg-slate-50 text-sm font-black text-slate-600 border-r border-slate-200">+91</span>
            <input
              value={state.phone}
              onChange={(e) => patch({ phone: e.target.value.replace(/\D/g, '').slice(0, 10), otpVerified: false })}
              placeholder="10-digit number"
              className="flex-1 px-3 py-3 text-sm font-extrabold text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Email (optional)</span>
          <input
            type="email"
            value={state.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="you@email.com"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
      </div>

      {!state.otpVerified && (
        <button
          type="button"
          disabled={state.phone.length !== 10 || sending}
          onClick={send}
          className="w-full rounded-xl border border-[#3083ff] text-[#3083ff] py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send 4-digit OTP'}
        </button>
      )}
      {state.otpVerified && (
        <p className="text-xs font-extrabold text-emerald-600">Mobile verified</p>
      )}
      {auth.error && <p className="text-sm font-semibold text-rose-600">{auth.error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 py-3.5 text-xs font-black uppercase tracking-wider">
          Back
        </button>
        <button
          type="button"
          disabled={!ready || submitting}
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white py-3.5 text-xs font-black uppercase tracking-wider"
        >
          {submitting ? 'Booking…' : 'Confirm evaluation'}
        </button>
      </div>

      {otpOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form
            onSubmit={confirmOtp}
            className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Verify OTP</p>
            <h3 className="font-display font-black text-xl text-slate-900 mt-1">Code sent to +91 {state.phone}</h3>
            <DevOtpHint />
            <div className="flex justify-center gap-3 mt-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  value={d}
                  maxLength={1}
                  inputMode="numeric"
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, '').slice(-1);
                    const next = [...digits];
                    next[i] = digit;
                    setDigits(next);
                    if (digit && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
                  }}
                  className="w-14 h-16 text-center text-2xl font-black border border-slate-200 rounded-2xl focus:border-[#3083ff] outline-none"
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={otpValue.length !== OTP_LEN || sending}
              className="w-full mt-6 bg-[#3083ff] text-white font-black py-3.5 rounded-2xl disabled:opacity-50"
            >
              {sending ? 'Verifying…' : 'Verify'}
            </button>
            <button type="button" onClick={() => setOtpOpen(false)} className="w-full mt-2 text-xs font-bold text-slate-400">
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-bold text-slate-400">{k}</span>
      <span className="font-extrabold text-slate-900 text-right">{v}</span>
    </div>
  );
}
