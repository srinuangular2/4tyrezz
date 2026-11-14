import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const DISMISS_KEY = '4tyrezz-pwa-install-dismissed-v2';

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

function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isIosSafari() {
  if (!isIos()) return false;
  const ua = navigator.userAgent || '';
  const otherBrowser = /crios|fxios|edgios|opios|gsa\/|fbav|fban|instagram|whatsapp|line\//i.test(ua);
  return /safari/i.test(ua) && !otherBrowser;
}

/**
 * Android Chrome can show the system install dialog.
 * iPhone cannot: Apple only installs a web app from Safari's Share menu.
 */
export default function PwaInstallBanner() {
  const [deferred, setDeferred] = useState(() => (typeof window !== 'undefined' ? window.__pwaInstall : null));
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const ios = isIos();
  const safari = isIosSafari();

  useEffect(() => {
    if (isStandalone()) return undefined;
    if (localStorage.getItem(DISMISS_KEY) === '1') return undefined;
    if (!isMobile() && !isIos()) return undefined;

    const remember = (event) => {
      event.preventDefault();
      window.__pwaInstall = event;
      setDeferred(event);
      setVisible(true);
    };
    const onReady = () => {
      if (window.__pwaInstall) setDeferred(window.__pwaInstall);
    };
    if (window.__pwaInstall) setDeferred(window.__pwaInstall);
    window.addEventListener('beforeinstallprompt', remember);
    window.addEventListener('pwa-install-ready', onReady);

    const t = window.setTimeout(() => setVisible(true), ios ? 600 : 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', remember);
      window.removeEventListener('pwa-install-ready', onReady);
      window.clearTimeout(t);
    };
  }, [ios]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const installAndroid = async () => {
    const promptEvent = deferred || window.__pwaInstall;
    if (!promptEvent?.prompt) return;
    promptEvent.prompt();
    try {
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') dismiss();
    } catch {
      /* the browser closed the dialog */
    }
    window.__pwaInstall = null;
    setDeferred(null);
  };

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
  };

  if (!visible || isStandalone()) return null;

  if (ios) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-[85] px-3 pb-2 lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#d7e6ff] bg-white p-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#3083ff] px-1">
              <img src="/blue-logo.png" alt="" className="h-6 w-full object-contain brightness-0 invert" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-slate-900">Add 4tyrezz to your iPhone</p>
              <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">
                {safari
                  ? 'iPhone has no Install button. Add it from Safari, then it opens like an app.'
                  : 'iPhone only installs from Safari. Open this page there, then add it to the Home Screen.'}
              </p>
            </div>
            <button type="button" onClick={dismiss} className="shrink-0 p-1 text-slate-400" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="mt-3 space-y-2">
            {!safari && (
              <li className="flex items-center gap-2 text-[13px] font-medium text-slate-800">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[11px] font-semibold text-[#1853ff]">1</span>
                Open this page in Safari
              </li>
            )}
            <li className="flex items-center gap-2 text-[13px] font-medium text-slate-800">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[11px] font-semibold text-[#1853ff]">{safari ? '1' : '2'}</span>
              Tap <Share className="h-3.5 w-3.5 text-[#3083ff]" strokeWidth={2.4} /> Share at the bottom of Safari
            </li>
            <li className="flex items-center gap-2 text-[13px] font-medium text-slate-800">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[11px] font-semibold text-[#1853ff]">{safari ? '2' : '3'}</span>
              Tap <span className="font-semibold">Add to Home Screen</span>, then Add
            </li>
          </ol>
          {!safari && (
            <button
              type="button"
              onClick={copyLink}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-[#3083ff] text-[13px] font-semibold text-white"
            >
              {copied ? 'Link copied — paste it in Safari' : 'Copy link for Safari'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[80] px-3 pt-2 lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-[#d7e6ff] bg-white p-3 shadow-[0_10px_28px_rgba(48,131,255,0.18)]">
        <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#3083ff] px-1.5">
          <img src="/blue-logo.png" alt="" className="h-8 w-full object-contain brightness-0 invert" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-slate-900">Install 4tyrezz</p>
          <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">
            No Play Store. Install it on your phone and open it like an app.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={installAndroid}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#3083ff] px-3 text-[12px] font-semibold text-white"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
              Install
            </button>
            <button type="button" onClick={dismiss} className="h-8 rounded-lg bg-slate-100 px-3 text-[11px] font-bold text-slate-600">
              Not now
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 p-1 text-slate-400" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
