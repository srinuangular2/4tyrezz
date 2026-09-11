import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SOUND_KEY = '4tyrezz:alertSound';
const EVENTS = [
  'NEW_LEAD',
  'NEW_FINANCE',
  'NEW_INSURANCE',
  'NEW_TEST_DRIVE',
  'NEW_BOOKING',
  'NEW_DEALER_KYC',
  'NEW_LISTING_MODERATION',
];

const SOUND_FILES = {
  lead: '/alert-lead.mp3',
  finance: '/alert-finance.mp3',
  insurance: '/alert-insurance.mp3',
  testdrive: '/alert-testdrive.mp3',
  booking: '/alert-booking.mp3',
  kyc: '/alert-kyc.mp3',
  moderation: '/alert-moderation.mp3',
};

const SOUND_TONES = {
  lead: [880],
  finance: [659, 880],
  insurance: [523, 784, 988],
  testdrive: [988, 784],
  booking: [740, 988],
  kyc: [440, 659],
  moderation: [587, 740],
};

function resolveSoundKey(payload) {
  const enquiry = String(payload?.meta?.enquiryType || payload?.soundKey || '').toLowerCase();
  const event = String(payload?.event || '');
  const type = String(payload?.type || '').toLowerCase();
  if (event === 'NEW_INSURANCE' || enquiry === 'insurance' || type === 'insurance') return 'insurance';
  if (event === 'NEW_FINANCE' || enquiry === 'finance' || type === 'finance') return 'finance';
  if (event === 'NEW_TEST_DRIVE' || type === 'test_drive' || type === 'testdrive') return 'testdrive';
  if (event === 'NEW_BOOKING' || type === 'booking') return 'booking';
  if (event === 'NEW_DEALER_KYC' || type === 'kyc') return 'kyc';
  if (event === 'NEW_LISTING_MODERATION' || type === 'moderation') return 'moderation';
  return 'lead';
}

const emptyCounts = {
  unread: 0,
  leads: 0,
  testDrives: 0,
  bookings: 0,
  kycPending: 0,
  moderation: 0,
  unreadByType: { leads: 0, testDrives: 0, bookings: 0, kycPending: 0, moderation: 0 },
};

const AlertsContext = createContext(null);

function socketOrigin() {
  const raw = import.meta.env.VITE_API_URL || '';
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/api\/?$/, '');
  return window.location.origin;
}

function playOscillator(soundKey = 'lead') {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = SOUND_TONES[soundKey] || SOUND_TONES.lead;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.18;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  } catch {
    /* ignore */
  }
}

function playFile(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.volume = 0.7;
    audio.onended = () => resolve(true);
    audio.onerror = () => reject(new Error('audio error'));
    audio.play().then(() => resolve(true)).catch(reject);
  });
}

function playChime(payload) {
  if (localStorage.getItem(SOUND_KEY) === 'off') return;
  const soundKey = resolveSoundKey(payload);
  const typed = SOUND_FILES[soundKey] || '/alert-lead.mp3';
  playFile(typed)
    .catch(() => playFile('/alert.mp3'))
    .catch(() => playFile('/alert.wav'))
    .catch(() => playOscillator(soundKey));
}

function toastAlert(payload, dark) {
  const title = payload?.title || 'New alert';
  const message = payload?.message || payload?.body || '';
  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'opacity-0'} pointer-events-auto w-[min(92vw,380px)] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
          dark
            ? 'bg-slate-950/85 border-rose-500/40 text-slate-100 shadow-[0_0_28px_rgba(244,63,94,0.25)]'
            : 'bg-white/80 border-rose-200 text-slate-900'
        }`}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-400">Live alert</p>
        <p className="mt-1 text-sm font-black">{title}</p>
        {message && <p className={`mt-0.5 text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>}
      </div>
    ),
    { duration: 5000, position: 'top-right' }
  );
}

export function RealtimeAlertsProvider({ children, token, enabled, variant = 'admin' }) {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(emptyCounts);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== 'off');
  const [connected, setConnected] = useState(false);
  const seenRef = useRef(new Set());
  const dark = variant === 'admin';

  const refresh = useCallback(async () => {
    if (!enabled || !token) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 20 } }),
        api.get('/notifications/unread-counts'),
      ]);
      setItems(listRes.data?.data || []);
      setCounts({ ...emptyCounts, ...(countRes.data || {}) });
    } catch {
      /* keep last known */
    }
  }, [enabled, token]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
  }, [soundOn]);

  useEffect(() => {
    if (!enabled || !token) {
      setItems([]);
      setCounts(emptyCounts);
      setConnected(false);
      return undefined;
    }
    refresh();
    const socket = io(socketOrigin(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1200,
    });

    const onPayload = (payload) => {
      const key = `${payload?.entityId || payload?.title || ''}:${payload?.message || payload?.body || ''}:${payload?.event || ''}`;
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);
      toastAlert(payload, dark);
      playChime(payload);
      if (payload?.notification) {
        setItems((prev) => [payload.notification, ...prev].slice(0, 40));
      } else {
        setItems((prev) => [
          {
            _id: `live-${Date.now()}`,
            title: payload?.title,
            body: payload?.message || payload?.body,
            message: payload?.message || payload?.body,
            type: payload?.type,
            event: payload?.event,
            link: variant === 'dealer' ? payload?.dealerLink || payload?.link : payload?.link,
            isRead: false,
            read: false,
            createdAt: payload?.createdAt || new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 40));
      }
      refresh();
    };

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    EVENTS.forEach((name) => socket.on(name, onPayload));

    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      EVENTS.forEach((name) => socket.off(name, onPayload));
      socket.disconnect();
    };
  }, [enabled, token, refresh, dark, variant]);

  const markRead = useCallback(
    async ({ all, id } = {}) => {
      try {
        if (all) {
          await api.patch('/notifications/mark-read', { all: true });
        } else if (id) {
          await api.patch('/notifications/mark-read', { id });
        }
        await refresh();
      } catch {
        /* ignore */
      }
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      items,
      counts,
      unread: counts.unread || 0,
      soundOn,
      setSoundOn,
      connected,
      refresh,
      markRead,
      variant,
    }),
    [items, counts, soundOn, connected, refresh, markRead, variant]
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useRealtimeAlerts() {
  return useContext(AlertsContext);
}
