import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ProfileCard } from '../components/ui';

const FALLBACK_COLUMNS = [
  'New Lead',
  'Contacted',
  'Follow-Up Scheduled',
  'Test Drive Booked',
  'Negotiation',
  'Token Booked',
  'Sold',
  'Lost',
];

const ALERT = {
  Overdue: 'bg-rose-50 text-rose-700',
  Today: 'bg-amber-50 text-amber-700',
  Upcoming: 'bg-emerald-50 text-emerald-700',
};

export default function DealerLeadCrm() {
  const [view, setView] = useState('kanban');
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState(FALLBACK_COLUMNS);
  const [outcomes, setOutcomes] = useState([]);
  const [sources, setSources] = useState([]);
  const [models, setModels] = useState([]);
  const [filters, setFilters] = useState({ status: '', source: '', model: '', from: '', to: '' });
  const [active, setActive] = useState(null);
  const [note, setNote] = useState('');
  const [type, setType] = useState('call');
  const [nextAt, setNextAt] = useState('');
  const [rep, setRep] = useState('');
  const [outcome, setOutcome] = useState('');
  const [tokenAmt, setTokenAmt] = useState('');
  const [reps, setReps] = useState([]);

  const load = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    api.get('/dealer/leads', { params }).then((r) => {
      setRows(r.data.data || []);
      if (r.data.columns?.length) setColumns(r.data.columns);
      if (r.data.callOutcomes?.length) setOutcomes(r.data.callOutcomes);
    }).catch(() => setRows([]));
  };

  useEffect(() => { load(); }, [filters.status, filters.source, filters.model, filters.from, filters.to]);
  useEffect(() => {
    api.get('/meta/statuses').then((r) => {
      if (r.data.leads?.length) setColumns(r.data.leads);
      if (r.data.callOutcomes?.length) setOutcomes(r.data.callOutcomes);
      if (r.data.leadSources?.length) setSources(r.data.leadSources);
    }).catch(() => {});
    api.get('/dealer/onboarding').then((r) => setReps(r.data.data?.profile?.salesReps || [])).catch(() => {});
    api.get('/models').then((r) => setModels(r.data?.data || r.data || [])).catch(() => setModels([]));
  }, []);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(columns.map((c) => [c, []]));
    rows.filter((r) => r.kind !== 'test_drive' || true).forEach((r) => {
      const col = columns.includes(r.stage || r.column) ? (r.stage || r.column) : columns[0];
      if (!map[col]) map[col] = [];
      map[col].push(r);
    });
    return map;
  }, [rows, columns]);

  const move = async (id, stage, kind) => {
    if (kind && kind !== 'buyer') return toast.error('Only buyer leads move on this pipeline');
    try {
      await api.patch(`/dealer/leads/${id}/stage`, { stage });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update stage');
    }
  };

  const onDrop = (stage, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    const kind = e.dataTransfer.getData('kind');
    if (id) move(id, stage, kind);
  };

  const saveFollowUp = async () => {
    if (!active) return;
    try {
      await api.post(`/dealer/leads/${active.id}/assign`, {
        assignedRep: rep,
        followUpAt: nextAt || null,
        remarks: note,
        callOutcome: outcome,
      });
      if (note) await api.post(`/dealer/leads/${active.id}/activity`, { type, note, nextFollowUpAt: nextAt || null });
      toast.success('Lead updated');
      setActive(null);
      setNote('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save');
    }
  };

  const convert = async () => {
    if (!active) return;
    try {
      await api.post(`/dealer/leads/${active.id}/convert-booking`, { tokenAmount: Number(tokenAmt) || undefined });
      toast.success('Converted to booking / sale invoice');
      setActive(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not convert');
    }
  };

  const Card = ({ r }) => (
    <div
      draggable={r.kind === 'buyer'}
      onDragStart={(e) => {
        e.dataTransfer.setData('leadId', r.id);
        e.dataTransfer.setData('kind', r.kind || 'buyer');
      }}
      className="w-full text-left rounded-xl border border-slate-100 bg-white p-3 shadow-sm cursor-grab"
    >
      <button type="button" onClick={() => { setActive(r); setRep(r.assignedRep || ''); setOutcome(r.callOutcome || ''); }} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="font-black text-sm text-slate-900">{r.customerName}</p>
          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${ALERT[r.alert] || ALERT.Upcoming}`}>{r.alert}</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-500 mt-1">{r.carTitle || '—'} · {r.mobile}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{r.source} · {r.leadId}</p>
      </button>
    </div>
  );

  return (
    <ProfileCard
      eyebrow="CRM"
      title="Lead & sales pipeline"
      action={
        <div className="flex gap-2">
          {['kanban', 'table'].map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={`text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl ${view === v ? 'bg-[#3083ff] text-white' : 'border border-slate-200'}`}>{v}</button>
          ))}
        </div>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <select className="border rounded-xl px-3 py-2 text-sm font-bold" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All stages</option>
          {columns.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="border rounded-xl px-3 py-2 text-sm font-bold" value={filters.source} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}>
          <option value="">All sources</option>
          {(sources.length ? sources : ['website', 'call', 'whatsapp', 'test_drive', 'valuation']).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="border rounded-xl px-3 py-2 text-sm font-bold" value={filters.model} onChange={(e) => setFilters((f) => ({ ...f, model: e.target.value }))}>
          <option value="">All models</option>
          {(Array.isArray(models) ? models : []).slice(0, 80).map((m) => <option key={m._id || m.name} value={m.name}>{m.name}</option>)}
        </select>
        <input type="date" className="border rounded-xl px-3 py-2 text-sm" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        <input type="date" className="border rounded-xl px-3 py-2 text-sm" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 gap-3 overflow-x-auto">
          {columns.map((col) => (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(col, e)}
              className="rounded-2xl bg-slate-50 p-2 min-h-[220px]"
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">{col} · {(grouped[col] || []).length}</p>
              <div className="space-y-2">{(grouped[col] || []).map((r) => <Card key={r.id} r={r} />)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr className="text-left">
                {['Lead', 'Customer', 'Car', 'Source', 'Stage', 'Rep', 'Follow-up'].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 cursor-pointer" onClick={() => setActive(r)}>
                  <td className="py-3 pr-3 font-black">{r.leadId}</td>
                  <td className="py-3 pr-3">{r.customerName}<br /><span className="text-xs text-slate-400">{r.mobile}</span></td>
                  <td className="py-3 pr-3">{r.carTitle || '—'}</td>
                  <td className="py-3 pr-3">{r.source}</td>
                  <td className="py-3 pr-3">{r.stage || r.column}</td>
                  <td className="py-3 pr-3">{r.assignedRep || '—'}</td>
                  <td className="py-3">{r.followUpAt ? new Date(r.followUpAt).toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={() => setActive(null)} aria-label="Close" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setActive(null)} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full border border-slate-200 text-slate-500 font-black">✕</button>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff]">{active.kind} lead</p>
            <h2 className="font-display font-black text-xl mt-1">{active.customerName}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">{active.carTitle} · {active.mobile}</p>
            <select className="mt-4 w-full border rounded-xl px-3 py-2 text-sm font-bold" value={rep} onChange={(e) => setRep(e.target.value)}>
              <option value="">Assign sales rep</option>
              {reps.filter((s) => s.active !== false).map((s) => <option key={s._id || s.name} value={s.name}>{s.name}</option>)}
              {rep && !reps.some((s) => s.name === rep) ? <option value={rep}>{rep}</option> : null}
            </select>
            <input className="mt-2 w-full border rounded-xl px-3 py-2 text-sm" placeholder="Or type rep name" value={rep} onChange={(e) => setRep(e.target.value)} />
            <select className="mt-2 w-full border rounded-xl px-3 py-2 text-sm font-bold" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="">Call outcome</option>
              {outcomes.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select className="mt-2 w-full border rounded-xl px-3 py-2 text-sm font-bold" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="call">Call notes</option>
              <option value="whatsapp">WhatsApp log</option>
              <option value="note">Note</option>
            </select>
            <textarea className="mt-2 w-full border rounded-xl px-3 py-2 text-sm" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Interaction remarks" />
            <input type="datetime-local" className="mt-2 w-full border rounded-xl px-3 py-2 text-sm" value={nextAt} onChange={(e) => setNextAt(e.target.value)} />
            <button type="button" onClick={saveFollowUp} className="mt-3 w-full bg-[#3083ff] text-white font-black rounded-xl py-2.5 text-sm">Save follow-up</button>
            {active.kind === 'buyer' && (
              <div className="mt-4 pt-4 border-t">
                <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Token amount" value={tokenAmt} onChange={(e) => setTokenAmt(e.target.value.replace(/\D/g, ''))} />
                <button type="button" onClick={convert} className="mt-2 w-full border border-slate-900 text-slate-900 font-black rounded-xl py-2.5 text-sm">Convert to booking / sale invoice</button>
              </div>
            )}
          </div>
        </div>
      )}
    </ProfileCard>
  );
}
