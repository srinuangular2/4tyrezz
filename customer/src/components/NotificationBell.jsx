import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';

function timeAgo(date) {
  if (!date) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell({ variant = 'admin' }) {
  const alerts = useRealtimeAlerts();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dark = variant === 'admin';

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!alerts) return null;
  const unread = alerts.unread || 0;
  const items = alerts.items || [];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition ${
          dark
            ? 'bg-white/5 border border-slate-800 text-slate-200 hover:bg-white/10'
            : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
        }`}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center bell-badge-glow">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-[min(92vw,380px)] rounded-2xl overflow-hidden z-50 ${
            dark
              ? 'bg-slate-950/95 border border-slate-800 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl'
              : 'bg-white/95 border border-slate-200 shadow-2xl backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
            <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Alerts</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !alerts.soundOn;
                  alerts.setSoundOn(next);
                  if (next) alerts.testChime?.();
                  else alerts.primeSound?.();
                }}
                className={`p-1.5 rounded-lg ${dark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
                title={alerts.soundOn ? 'Mute chime' : 'Enable chime'}
              >
                {alerts.soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                type="button"
                onClick={() => alerts.markRead({ all: true })}
                className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300"
              >
                Mark all as Read
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className={`px-4 py-8 text-center text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                No alerts yet
              </p>
            )}
            {items.map((n) => {
              const unreadRow = !(n.isRead || n.read);
              return (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => {
                    if (n._id && !String(n._id).startsWith('live-')) alerts.markRead({ id: n._id });
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                  className={`w-full text-left px-4 py-3 border-b last:border-0 transition ${
                    dark
                      ? `border-slate-800/60 hover:bg-white/5 ${unreadRow ? 'bg-rose-500/5' : ''}`
                      : `border-slate-100 hover:bg-slate-50 ${unreadRow ? 'bg-rose-50/70' : ''}`
                  }`}
                >
                  <p className={`text-sm font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {n.title}
                    {n.body || n.message ? `: ${n.body || n.message}` : ''}
                  </p>
                  <p className={`mt-1 text-[11px] font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {timeAgo(n.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>
          {!alerts.soundOn && (
            <div className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              <BellOff size={12} /> Chime muted
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarCountBadge({ count, label, pulse, tone = 'admin' }) {
  if (!count) return null;
  const idle =
    tone === 'dealer'
      ? 'bg-slate-100 text-slate-600'
      : 'bg-slate-800 text-slate-300 border border-slate-700';
  return (
    <span
      className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
        pulse ? 'bg-rose-500 text-white badge-pulse' : idle
      }`}
    >
      {count} {label}
    </span>
  );
}
