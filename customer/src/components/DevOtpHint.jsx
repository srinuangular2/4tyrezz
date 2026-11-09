import { useSelector } from 'react-redux';

export default function DevOtpHint({ code, mobile }) {
  const store = useSelector((s) => s.auth);
  const otp = code || store.devOtp;
  const number = String(mobile || store.devMobile || '').replace(/\D/g, '').slice(-10);
  if (!otp || !number) return null;
  return (
    <p className="rounded-xl border border-[#d6e6ff] bg-[#f4f8ff] px-3 py-2 text-[12px] font-medium leading-relaxed text-[#1853ff]">
      Code for +91 {number}: <span className="font-semibold tracking-widest">{otp}</span>
    </p>
  );
}
