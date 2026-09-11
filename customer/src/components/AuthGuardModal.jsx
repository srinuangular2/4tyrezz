import { createContext, useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import AuthFlow from './AuthFlow';

const AuthGuardContext = createContext({ requireAuth: (fn) => fn?.(), isAuthed: false });

export function AuthGuardProvider({ children }) {
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const requireAuth = useCallback(
    (onAuthed) => {
      if (user) {
        onAuthed?.();
        return true;
      }
      setPending(() => onAuthed || null);
      setOpen(true);
      return false;
    },
    [user]
  );

  return (
    <AuthGuardContext.Provider value={{ requireAuth, isAuthed: Boolean(user) }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setOpen(false); setPending(null); }} aria-label="Close" />
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-3xl bg-white shadow-2xl border border-slate-100 p-5 mb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Account required</p>
              <h2 className="font-display font-black text-xl text-slate-900 mt-1">Please login or create an account to continue.</h2>
            </div>
            <AuthFlow
              variant="page"
              onClose={() => {
                setOpen(false);
                setPending(null);
              }}
              onSuccess={() => {
                const fn = pending;
                setOpen(false);
                setPending(null);
                fn?.();
              }}
            />
          </div>
        </div>
      )}
    </AuthGuardContext.Provider>
  );
}

export function useAuthGuard() {
  return useContext(AuthGuardContext);
}

export default function AuthGuardModal() {
  return null;
}
