import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ProfileCard } from '../components/ui';

const STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Feedback Recorded', 'No-Show'];

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function DealerTestDrives() {
  const [rows, setRows] = useState([]);
  const [day, setDay] = useState(dayKey(new Date()));
  const [edit, setEdit] = useState(null);

  const load = () => {
    api.get('/dealer/test-drives').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  };
  useEffect(() => { load(); }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return dayKey(d);
  }), []);

  const queue = rows.filter((r) => r.preferredDate && dayKey(r.preferredDate) === day);

  const save = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await api.patch(`/dealer/test-drives/${edit.id}`, {
        dlNumber: form.get('dlNumber'),
        status: form.get('status'),
        feedback: form.get('feedback'),
      });
      toast.success('Slot updated');
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };

  return (
    <ProfileCard eyebrow="Calendar" title="Test drive management">
      <div className="flex gap-2 overflow-x-auto mb-5">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDay(d)}
            className={`rounded-xl px-3 py-2 text-xs font-black ${day === d ? 'bg-[#3083ff] text-white' : 'bg-slate-50 text-slate-600'}`}
          >
            {new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {queue.length === 0 && <p className="text-sm font-semibold text-slate-500 py-8 text-center">No slots on this day.</p>}
        {queue.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-black text-slate-900">{r.customerName} · {r.preferredTime || 'Time TBD'}</p>
              <p className="text-xs font-semibold text-slate-500">{r.carTitle} · {r.homeTestDrive ? 'Home test drive' : 'Showroom'} · {r.mobile}</p>
              <p className="text-[11px] font-bold text-[#3083ff] mt-1">{r.status}{r.dlNumber ? ` · DL ${r.dlNumber}` : ''}</p>
            </div>
            <button type="button" onClick={() => setEdit(r)} className="text-xs font-black uppercase tracking-wider text-[#3083ff]">Manage slot</button>
          </div>
        ))}
      </div>

      {edit && (
        <form onSubmit={save} className="mt-5 rounded-2xl bg-slate-50 p-4 grid sm:grid-cols-2 gap-3">
          <p className="sm:col-span-2 font-black text-slate-900">Verify DL before approving · {edit.customerName}</p>
          <input name="dlNumber" defaultValue={edit.dlNumber} placeholder="Driving licence number" className="border rounded-xl px-3 py-2 text-sm font-bold uppercase" />
          <select name="status" defaultValue={edit.status} className="border rounded-xl px-3 py-2 text-sm font-bold">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <textarea name="feedback" defaultValue={edit.feedback} placeholder="Feedback / no-show notes" className="sm:col-span-2 border rounded-xl px-3 py-2 text-sm" rows={2} />
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="bg-[#3083ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-4 py-2.5">Save</button>
            <button type="button" onClick={() => setEdit(null)} className="text-xs font-bold">Cancel</button>
          </div>
        </form>
      )}
    </ProfileCard>
  );
}
