import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { requestOtp, verifyOtp } from '../app/authSlice';
import { Close } from './icons';

export default function OtpLoginModal({ onClose }) {
  const dispatch = useDispatch();
  const { devOtp, error } = useSelector((s) => s.auth);
  const [step, setStep] = useState('mobile'); // mobile | otp
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    await dispatch(requestOtp(mobile));
    setLoading(false);
    setStep('otp');
  };

  const confirmOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await dispatch(verifyOtp({ mobile, otp }));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-7 relative animate-fadeUp" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-ink"><Close /></button>
        <h2 className="font-display font-extrabold text-2xl">Login to 4tyrezz</h2>
        <p className="text-sm text-slate2 mt-1 mb-5">Buy or sell used cars — verified &amp; hassle-free.</p>

        {step === 'mobile' ? (
          <form onSubmit={sendOtp} className="space-y-3">
            <label className="text-xs font-semibold text-slate2">Mobile number</label>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <span className="px-3 py-3 bg-slate-50 text-sm text-slate2 border-r border-slate-200">+91</span>
              <input
                required pattern="[0-9]{10}" maxLength={10}
                value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210" className="flex-1 px-3 py-3 text-sm outline-none"
              />
            </div>
            <button disabled={loading} className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-3 rounded-lg transition">
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmOtp} className="space-y-3">
            <label className="text-xs font-semibold text-slate2">Enter the 6-digit OTP sent to +91 {mobile}</label>
            <input
              required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm outline-none tracking-widest"
            />
            {devOtp && (
              <p className="text-xs text-verify bg-verify-bg rounded-md px-3 py-2">
                Dev mode: OTP is <strong>{devOtp}</strong> (no SMS provider configured yet)
              </p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button disabled={loading} className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-3 rounded-lg transition">
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <button type="button" onClick={() => setStep('mobile')} className="w-full text-xs text-slate2 hover:text-ink">
              ← Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
