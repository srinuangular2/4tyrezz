import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = '4tyrezz-pwa-install-dismissed';

function isStandalone() {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

/**
 * Prompts users to install 4tyrezz as a home-screen app (Android install /
 * iOS Add to Home Screen). Hidden once installed or dismissed.
 */
export default function PwaInstallBanner() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;
    if (localStorage.getItem(DISMISS_KEY) === '1') return undefined;
    if (!isMobile()) return undefined;

    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    // Soft prompt: iOS tip, or generic install tip when native prompt is unavailable
    const t = window.setTimeout(() => {
      setVisible((already) => {
        if (already) return already;
        return true;
      });
    }, 2800);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
    setDeferred(null);
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch {
        /* ignore */
      }
      setDeferred(null);
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, '1');
    }
  };

  if (!visible || isStandalone()) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[60] px-3 pt-2 lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-[#d7e6ff] bg-white p-3 shadow-[0_10px_28px_rgba(48,131,255,0.18)]">
        <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#3083ff] px-1.5">
          <img src="/blue-logo.png" alt="" className="h-8 w-full object-contain brightness-0 invert" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-slate-900">Install 4tyrezz</p>
          <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">
            No Play Store. Install it on your phone and open it like an app.
          </p>
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#3083ff] text-white text-[12px] font-semibold"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold"
            >
              Not now
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="p-1 text-slate-400 shrink-0" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
