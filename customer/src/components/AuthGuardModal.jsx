import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AuthFlow from './AuthFlow';

const AuthGuardContext = createContext({ requireAuth: (fn) => fn?.(), isAuthed: false });

export function AuthGuardProvider({ children }) {
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const close = useCallback(() => {
    setOpen(false);
    setPending(null);
  }, []);

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

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <AuthGuardContext.Provider value={{ requireAuth, isAuthed: Boolean(user) }}>
      {children}
      {open && (
        <AuthFlow
          variant="modal"
          onClose={close}
          showClose
          onSuccess={() => {
            const fn = pending;
            close();
            fn?.();
          }}
        />
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
