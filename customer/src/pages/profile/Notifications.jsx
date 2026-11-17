import { useEffect, useState } from 'react';
import { Bell, CarFront, ClipboardList, Landmark, Shield, Sparkles, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { customerNotificationLink } from '../../lib/customerNotificationLink';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { formatWhen } from './hubUtils';

const NOTICE_TONES = {
  price_drop: { label: 'Price drop', icon: TrendingDown, tile: 'from-[#ffb067] to-[#f97316]', wash: 'bg-orange-50', ink: 'text-orange-600' },
  match: { label: 'New match', icon: Sparkles, tile: 'from-[#5ee08a] to-[#0e9f55]', wash: 'bg-emerald-50', ink: 'text-emerald-700' },
  availability: { label: 'Availability', icon: CarFront, tile: 'from-[#ff9bb5] to-[#e11d48]', wash: 'bg-rose-50', ink: 'text-rose-600' },
  system: { label: 'Update', icon: Bell, tile: 'from-[#b7c2ff] to-[#4f46e5]', wash: 'bg-indigo-50', ink: 'text-indigo-600' },
  approval: { label: 'Approval', icon: Sparkles, tile: 'from-[#7eebff] to-[#0891b2]', wash: 'bg-cyan-50', ink: 'text-cyan-700' },
  lead: { label: 'Enquiry', icon: ClipboardList, tile: 'from-[#6cb2ff] to-[#1853ff]', wash: 'bg-blue-50', ink: 'text-[#1853ff]' },
  finance: { label: 'Finance', icon: Landmark, tile: 'from-[#ffe08a] to-[#f59e0b]', wash: 'bg-amber-50', ink: 'text-amber-700' },
  insurance: { label: 'Insurance', icon: Shield, tile: 'from-[#ff9bb5] to-[#e11d48]', wash: 'bg-rose-50', ink: 'text-rose-600' },
  booking: { label: 'Booking', icon: ClipboardList, tile: 'from-[#c4a1ff] to-[#7c3aed]', wash: 'bg-violet-50', ink: 'text-violet-700' },
  test_drive: { label: 'Test drive', icon: CarFront, tile: 'from-[#7eebff] to-[#0891b2]', wash: 'bg-cyan-50', ink: 'text-cyan-700' },
};

function noticeTone(item) {
  const kind = String(item?.meta?.kind || '');
  if (kind.includes('availability')) return NOTICE_TONES.availability;
  const event = String(item?.event || '');
  if (event === 'NEW_LEAD') return NOTICE_TONES.lead;
  if (event === 'NEW_FINANCE') return NOTICE_TONES.finance;
  if (event === 'NEW_INSURANCE') return NOTICE_TONES.insurance;
  if (event === 'NEW_BOOKING') return NOTICE_TONES.booking;
  if (event === 'NEW_TEST_DRIVE') return NOTICE_TONES.test_drive;
  const type = String(item?.type || '').toLowerCase();
  if (type === 'lead') return NOTICE_TONES.lead;
  return NOTICE_TONES[type] || NOTICE_TONES.system;
}

export default function Notifications() {
  const [rows, setRows] = useState(null);
  const [unread, setUnread] = useState(0);

  const load = () =>
    api
      .get('/notifications')
      .then((r) => {
        setRows(r.data.data || []);
        setUnread(r.data.unread || 0);
      })
      .catch(() => {
        setRows([]);
        setUnread(0);
      });

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setRows((list) => (list || []).map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not mark as read');
    }
  };

  const markOne = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setRows((list) => (list || []).map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((n) => Math.max(0, n - 1));
  };

  return (
    <ProfileCard
      eyebrow="Alerts"
      title="Notifications"
      action={
        unread > 0 ? (
          <button type="button" onClick={markAll} className="text-[11px] font-black text-[#3083ff]">
            Mark all as read
          </button>
        ) : null
      }
    >
      {rows === null && <p className="text-sm font-semibold text-slate-500">Loading notifications…</p>}
      {rows && rows.length === 0 && <EmptyNote>No price-drop, search-match or system alerts yet.</EmptyNote>}
      <div className="space-y-3">
        {(rows || []).map((n) => {
          const tone = noticeTone(n);
          const Icon = tone.icon;
          return (
            <article key={n._id} className={`rounded-[22px] border border-slate-200 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${n.read ? 'bg-white' : tone.wash}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_8px_16px_rgba(15,23,42,0.12)] ${tone.tile}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-semibold ${tone.ink}`}>{tone.label}</p>
                  <p className="mt-0.5 text-[14px] font-semibold leading-snug text-slate-900">{n.title}</p>
                  {n.body || n.message ? <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{n.body || n.message}</p> : null}
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-[12px] text-slate-400">{formatWhen(n.createdAt)}</p>
                    {customerNotificationLink(n) ? <Link to={customerNotificationLink(n)} className="text-[12px] font-semibold text-[#3083ff]">Open</Link> : null}
                    {!n.read && (
                      <button type="button" onClick={() => markOne(n._id)} className="text-[12px] font-semibold text-[#3083ff]">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </ProfileCard>
  );
}
