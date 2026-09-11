import { useSelector } from 'react-redux';

export default function DevOtpHint({ code, mobile }) {
  const store = useSelector((s) => s.auth);
  const otp = code || store.devOtp;
  const number = String(mobile || store.devMobile || '').replace(/\D/g, '').slice(-10);
  if (!otp || !number) return null;
  return (
    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800 leading-relaxed">
      Dev Mode: Your OTP for +91 {number} is {otp}
    </p>
  );
}
