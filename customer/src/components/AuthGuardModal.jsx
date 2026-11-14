import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AuthFlow from './AuthFlow';

const AuthGuardContext = createContext({ requireAuth: (fn) => fn?.(), releaseLock: () => {}, isAuthed: false });

export function AuthGuardProvider({ children }) {
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [locked, setLocked] = useState(false);
  const [onCancel, setOnCancel] = useState(null);
  const lockedRef = useRef(false);
  lockedRef.current = locked;

  const close = useCallback(() => {
    setOpen(false);
    setPending(null);
    setLocked(false);
    setOnCancel(null);
  }, []);

  const requireAuth = useCallback(
    (onAuthed, options = {}) => {
      if (user) {
        if (typeof onAuthed === 'function') onAuthed();
        return true;
      }
      setPending(() => (typeof onAuthed === 'function' ? onAuthed : null));
      setLocked(Boolean(options.locked));
      setOnCancel(() => (typeof options.onCancel === 'function' ? options.onCancel : null));
      setOpen(true);
      return false;
    },
    [user]
  );

  const releaseLock = useCallback(() => {
    if (!lockedRef.current) return;
    setOpen(false);
    setPending(null);
    setLocked(false);
    setOnCancel(null);
  }, []);

  const leaveLocked = useCallback(() => {
    const leave = onCancel;
    close();
    leave?.();
  }, [onCancel, close]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !lockedRef.current) close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <AuthGuardContext.Provider value={{ requireAuth, releaseLock, isAuthed: Boolean(user) }}>
      {children}
      {open && (
        <AuthFlow
          variant="modal"
          locked={locked}
          onClose={locked ? leaveLocked : close}
          showClose={!locked}
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
