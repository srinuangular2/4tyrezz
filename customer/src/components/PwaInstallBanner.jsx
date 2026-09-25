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

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
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
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;
    if (localStorage.getItem(DISMISS_KEY) === '1') return undefined;
    if (!isMobile()) return undefined;

    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
      setIosHint(false);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    // Soft prompt: iOS tip, or generic install tip when native prompt is unavailable
    const t = window.setTimeout(() => {
      setVisible((already) => {
        if (already) return already;
        if (isIos()) setIosHint(true);
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
      return;
    }
    // No native prompt — keep banner open with instructions
    setIosHint(true);
  };

  if (!visible || isStandalone()) return null;

  return (
    <div className="lg:hidden fixed inset-x-0 z-[75] px-3 pointer-events-none bottom-[calc(72px+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#3083ff]/25 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] p-3.5 flex gap-3 items-start">
        <div className="w-11 h-11 rounded-xl bg-[#3083ff] flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/apple-touch-icon.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-slate-900 leading-snug">Install 4tyrezz app</p>
          {iosHint || isIos() ? (
            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
              Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> for a one-tap app icon.
            </p>
          ) : (
            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
              Save to your home screen and open like an app — no browser URL needed.
            </p>
          )}
          <div className="flex gap-2 mt-2.5">
            {!isIos() && (
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#3083ff] text-white text-[11px] font-black"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
                {deferred ? 'Install' : 'How to install'}
              </button>
            )}
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
