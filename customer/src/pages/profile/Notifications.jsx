import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyNote, ProfileCard } from './ProfileLayout';

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
      <ol className="space-y-3">
        {(rows || []).map((n) => (
          <li
            key={n._id}
            className={`rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border px-4 py-3 ${n.read ? 'border-white/20 dark:border-slate-800/80' : 'border-blue-200 bg-blue-50/40'}`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff]">{n.type || 'Update'}</p>
            <p className="font-black text-slate-900 text-sm mt-0.5">{n.title}</p>
            {n.body || n.message ? <p className="text-xs font-semibold text-slate-500 mt-1">{n.body || n.message}</p> : null}
            {n.link ? (
              <a href={n.link} className="inline-block text-[11px] font-black text-[#3083ff] mt-2">
                Open
              </a>
            ) : null}
            <div className="flex justify-between mt-2">
              <p className="text-[11px] font-semibold text-slate-400">
                {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : ''}
              </p>
              {!n.read && (
                <button type="button" onClick={() => markOne(n._id)} className="text-[11px] font-black text-[#3083ff]">
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </ProfileCard>
  );
}
