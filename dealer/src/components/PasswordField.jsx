import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { inputClass } from '../lib/kycValidation';

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  maxLength,
  placeholder,
  required,
  className = '',
}) {
  const [show, setShow] = useState(false);
  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      ) : null}
      <div className={`relative ${label ? 'mt-1.5' : ''}`}>
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          {show ? <EyeOff size={18} strokeWidth={2.4} /> : <Eye size={18} strokeWidth={2.4} />}
        </button>
      </div>
    </label>
  );
}
