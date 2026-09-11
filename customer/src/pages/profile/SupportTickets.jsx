import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { inputClass } from '../../lib/kycValidation';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { StatusPill } from './hubUtils';

export default function SupportTickets() {
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ subject: '', message: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState({});

  const load = () => api.get('/support/tickets').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));

  useEffect(() => {
    load();
    api
      .get('/meta/statuses')
      .then((r) => setCategories(r.data.ticketCategories || []))
      .catch(() => setCategories([]));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return toast.error('Subject and message are required');
    setSaving(true);
    try {
      await api.post('/support/tickets', {
        subject: form.subject.trim(),
        message: form.message.trim(),
        ...(form.category ? { category: form.category } : {}),
      });
      setForm({ subject: '', message: '', category: form.category });
      await load();
      toast.success('Ticket created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create ticket');
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (id) => {
    const body = String(reply[id] || '').trim();
    if (!body) return;
    try {
      const { data } = await api.post(`/support/tickets/${id}/replies`, { body });
      setRows((list) => (list || []).map((t) => (t._id === id ? data.data : t)));
      setReply((r) => ({ ...r, [id]: '' }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not send reply');
    }
  };

  return (
    <div className="space-y-6">
      <ProfileCard eyebrow="Help desk" title="New support ticket">
        <form onSubmit={create} className="space-y-3">
          {categories.length > 0 && (
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" />
          <textarea className={`${inputClass} min-h-[110px]`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe the issue" />
          <button disabled={saving} className="bg-[#3083ff] text-white font-black rounded-2xl py-3 px-5">
            {saving ? 'Submitting…' : 'Create ticket'}
          </button>
        </form>
      </ProfileCard>

      <ProfileCard eyebrow="Tracking" title="Support tickets">
        {rows === null && <p className="text-sm font-semibold text-slate-500">Loading tickets…</p>}
        {rows && rows.length === 0 && <EmptyNote>No tickets yet. Create one above if you need help.</EmptyNote>}
        <div className="space-y-4">
          {(rows || []).map((t) => (
            <article key={t._id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-black text-slate-900">{t.subject}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{t.message}</p>
                </div>
                <StatusPill value={t.statusLabel || t.status} />
              </div>
              <div className="mt-3 space-y-2">
                {(t.replies || []).map((r, i) => (
                  <div key={`${t._id}-${i}`} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">{r.role} · {r.author}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{r.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  className={inputClass}
                  value={reply[t._id] || ''}
                  onChange={(e) => setReply((s) => ({ ...s, [t._id]: e.target.value }))}
                  placeholder="Reply to support"
                />
                <button type="button" onClick={() => sendReply(t._id)} className="shrink-0 px-4 rounded-2xl bg-slate-900 text-white text-xs font-black">
                  Send
                </button>
              </div>
            </article>
          ))}
        </div>
      </ProfileCard>
    </div>
  );
}
