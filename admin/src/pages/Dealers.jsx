import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Drawer, FilterPills, PageHeader, StatusBadge, btnGhost, btnPrimary, glass, inr, inputCls, mediaSrc } from '../components/admin/ui';

const KYC_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING_ADMIN_APPROVAL', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function Dealers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [kycStatus, setKycStatus] = useState('');
  const [search, setSearch] = useState('');
  const [review, setReview] = useState(null);
  const [perf, setPerf] = useState(null);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', password: '' });
  const [form, setForm] = useState({ name: '', dealershipName: '', city: '', email: '', mobile: '' });
  const [createdCreds, setCreatedCreds] = useState(null);

  const load = async (page = 1) => {
    const { data } = await api.get('/admin/dealers', { params: { page, limit: 12, kycStatus: kycStatus || undefined, search: search || undefined } });
    setRows(data.data || []);
    setMeta({ page: data.page, pages: data.pages });
  };

  useEffect(() => { load(1); }, [kycStatus]);

  const openReview = async (row) => {
    const [{ data: d }, { data: p }] = await Promise.all([
      api.get(`/admin/dealers/${row._id}`),
      api.get(`/admin/dealers/${row._id}/performance`).catch(() => ({ data: { data: {} } })),
    ]);
    setReview(d.data);
    setPerf(p.data || {});
    setReason('');
    setShowReject(false);
  };

  const act = async (action, extra = {}) => {
    try {
      await api.patch(`/admin/dealers/${review._id}/status`, { action, ...extra });
      toast.success(`Dealer ${action}d`);
      setReview(null);
      load(meta.page);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  const addDealer = async () => {
    const name = String(addForm.name || '').trim();
    const password = String(addForm.password || '').trim();
    if (!name) {
      toast.error('Dealer name is required');
      return;
    }
    if (!password) {
      toast.error('Set a password to share with the dealer');
      return;
    }
    if (!isStrongPassword(password)) {
      toast.error('Password must be 8–12 characters');
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      const { data } = await api.post('/admin/dealers', { name, password });
      setShowAdd(false);
      setAddForm({ name: '', password: '' });
      setRevealPassword(false);
      setCreatedCreds(data.credentials || null);
      toast.success('Dealer created. Copy the login and share it.');
      load(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create dealer');
    } finally {
      setCreating(false);
    }
  };

  const resetCreds = async () => {
    if (!review?._id) return;
    try {
      const { data } = await api.post(`/admin/dealers/${review._id}/credentials`);
      setCreatedCreds(data.credentials || null);
      setRevealPassword(false);
      toast.success('New password generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset credentials');
    }
  };

  const emptyForm = { name: '', dealershipName: '', city: '', email: '', mobile: '' };

  const openAdd = () => {
    setAddForm({ name: '', password: makeStrongPassword() });
    setRevealPassword(false);
    setShowAdd(true);
  };

  const openEdit = async (row) => {
    setShowEdit(true);
    setEditing(row);
    setForm(emptyForm);
    try {
      const { data } = await api.get(`/admin/dealers/${row._id}`);
      const d = data.data || {};
      setEditing(d);
      setForm({
        name: d.contactPerson || d.user?.name || '',
        dealershipName: d.businessName || d.user?.dealershipName || '',
        city: d.city || d.user?.city || '',
        email: d.contactEmail || d.user?.email || '',
        mobile: d.contactPhone || d.user?.mobile || '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load dealer');
      setShowEdit(false);
      setEditing(null);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    if (!String(form.name || '').trim()) {
      toast.error('Dealer name is required');
      return;
    }
    if (savingEdit) return;
    setSavingEdit(true);
    try {
      await api.patch(`/admin/dealers/${editing._id}`, form);
      toast.success('Dealer details updated');
      setShowEdit(false);
      setEditing(null);
      setForm(emptyForm);
      if (review?._id === editing._id) setReview(null);
      load(meta.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update dealer');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = (row) => {
    setEditing(row);
    setShowDelete(true);
  };

  const deleteDealer = async () => {
    if (!editing?._id) return;
    try {
      const { data } = await api.delete(`/admin/dealers/${editing._id}`);
      toast.success(data.message || 'Dealer deleted');
      setShowDelete(false);
      setEditing(null);
      if (review?._id === editing._id) setReview(null);
      load(meta.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete dealer');
    }
  };

  const columns = [
    { key: 'business', label: 'Dealership', render: (r) => r.businessName || r.user?.dealershipName || r.user?.name || '—' },
    { key: 'code', label: 'Dealer ID', render: (r) => r.user?.dealerCode || '—' },
    { key: 'gst', label: 'GSTIN', render: (r) => r.gstNumber || '—' },
    { key: 'city', label: 'City', render: (r) => r.city || r.user?.city || '—' },
    { key: 'kyc', label: 'KYC', render: (r) => <StatusBadge value={r.kycStatus} /> },
    { key: 'account', label: 'Account', render: (r) => <StatusBadge value={r.user?.isActive === false ? 'Suspended' : 'Active'} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex flex-wrap gap-3 justify-end">
          <button type="button" className="text-xs font-bold text-blue-400" onClick={() => openReview(r)}>
            Review
          </button>
          <button type="button" className="text-xs font-bold text-slate-300" onClick={() => openEdit(r)}>
            Edit
          </button>
          <button type="button" className="text-xs font-bold text-rose-400" onClick={() => confirmDelete(r)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Onboarding"
        title="Dealers"
        subtitle="KYC queue, GST/PAN checks, and account controls."
        actions={<button type="button" className={btnPrimary} onClick={openAdd}>+ Add dealer</button>}
      />
      <div className="flex flex-wrap gap-3 items-center">
        <FilterPills value={kycStatus} onChange={setKycStatus} options={KYC_FILTERS} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search business / GST / city"
          className={`${inputCls} max-w-xs`}
        />
      </div>
      <DataTable columns={columns} rows={rows} page={meta.page} pages={meta.pages} onPageChange={load} />

      {review && (
        <Drawer title={review.businessName || 'Dealer KYC'} onClose={() => setReview(null)} wide>
          <div className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Legal entity" value={review.legalEntityName || review.businessName} />
              <Field label="Type" value={review.businessType} />
              <CheckField label="PAN" check={review.checks?.pan} />
              <CheckField label="GSTIN" check={review.checks?.gst} />
              <CheckField label="IFSC" check={review.checks?.ifsc} />
              <Field label="Bank account" value={review.bankAccountNumber ? `••••${String(review.bankAccountNumber).slice(-4)}` : '—'} />
              <Field label="Dealer ID" value={review.user?.dealerCode} />
              <Field label="Contact" value={`${review.contactPerson || ''} ${review.contactPhone || ''}`} />
              <Field label="Address" value={[review.addressLine1, review.city, review.state, review.pincode].filter(Boolean).join(', ')} />
            </div>

            {perf && (
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 ${glass} rounded-xl p-3`}>
                <Metric label="Inventory" value={perf.inventory ?? 0} />
                <Metric label="Sold" value={perf.sold ?? 0} />
                <Metric label="Leads" value={perf.leads ?? 0} />
                <Metric label="Rating" value={perf.rating ?? '—'} />
                <Metric label="Commissions paid" value={inr(perf.commissionsPaid)} />
                <Metric label="Avg lead response" value={perf.avgLeadResponseHours != null ? `${perf.avgLeadResponseHours}h` : '—'} />
              </div>
            )}

            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Documents</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {(review.documents || []).map((d) => (
                  <a key={d._id} href={mediaSrc(d.url)} target="_blank" rel="noreferrer" className={`${glass} rounded-xl p-3 block hover:border-blue-500/40`}>
                    <p className="text-xs font-bold text-blue-300 uppercase">{d.type.replace(/_/g, ' ')}</p>
                    {/\.(png|jpe?g|webp)$/i.test(d.url || '') ? (
                      <img src={mediaSrc(d.url)} alt="" className="mt-2 w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">Open PDF / file</p>
                    )}
                  </a>
                ))}
                {!review.documents?.length && <p className="text-slate-500">No documents uploaded.</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className={btnPrimary} onClick={() => act('approve')}>Approve & activate dealer</button>
              <button type="button" className="bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl" onClick={() => setShowReject(true)}>Reject KYC</button>
              {review.user?.isActive === false ? (
                <button type="button" className={btnGhost} onClick={() => act('reactivate')}>Reactivate dealer</button>
              ) : (
                <button type="button" className={btnGhost} onClick={() => act('suspend')}>Suspend dealer</button>
              )}
              <button type="button" className={btnGhost} onClick={resetCreds}>Reset password</button>
              <button type="button" className={btnGhost} onClick={() => openEdit(review)}>Edit details</button>
              <button type="button" className="bg-rose-950 text-rose-300 text-sm font-bold px-4 py-2.5 rounded-xl border border-rose-800" onClick={() => confirmDelete(review)}>Delete dealer</button>
            </div>
          </div>
        </Drawer>
      )}

      {showReject && (
        <Modal title="Reject KYC" onClose={() => setShowReject(false)}>
          <textarea className={inputCls} rows={4} placeholder="Exact rejection reason (emailed / SMS)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button type="button" className={`${btnPrimary} w-full mt-3 bg-rose-600`} onClick={() => act('reject', { rejectionReason: reason })}>
            Send rejection
          </button>
        </Modal>
      )}

      {showAdd && (
        <Modal title="Add dealer" onClose={() => { if (!creating) { setShowAdd(false); setAddForm({ name: '', password: '' }); } }}>
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Enter the dealer name and a password. 4tyrezz issues a short Dealer ID like 4T-2026-89421. Share the login, then the dealer completes KYC after sign-in.
            </p>
            <input type="text" name="fake-user" autoComplete="username" className="hidden" tabIndex={-1} readOnly />
            <input type="password" name="fake-pass" autoComplete="current-password" className="hidden" tabIndex={-1} readOnly />
            <input
              required
              autoComplete="off"
              placeholder="Dealer name"
              className={inputCls}
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            />
            <div className="relative">
              <input
                required
                autoComplete="new-password"
                type={revealPassword ? 'text' : 'password'}
                placeholder="Password to share"
                className={`${inputCls} pr-24`}
                maxLength={12}
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value.slice(0, 12) })}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-400"
                onClick={() => setRevealPassword((v) => !v)}
              >
                {revealPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button type="button" className={btnGhost} onClick={() => setAddForm({ ...addForm, password: makeStrongPassword() })}>
              Generate strong password
            </button>
            <p className="text-[11px] text-slate-500">Must be 8–12 characters. Shorter than 8 is not accepted.</p>
            <button type="button" disabled={creating} className={`${btnPrimary} w-full`} onClick={addDealer}>
              {creating ? 'Creating…' : 'Create dealer'}
            </button>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal title="Edit dealer" onClose={() => { setShowEdit(false); setEditing(null); }}>
          <form onSubmit={saveEdit} className="space-y-3">
            <p className="text-xs text-slate-400">
              Updates name, company, city and contact. Dealer ID stays the same — use Reset password to issue new login credentials.
            </p>
            <input required placeholder="Dealer name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Company / dealership name (optional)" className={inputCls} value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} />
            <input placeholder="City (optional)" className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input type="email" autoComplete="off" placeholder="Email (optional)" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input autoComplete="off" placeholder="Mobile (optional)" className={inputCls} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <button type="submit" disabled={savingEdit} className={`${btnPrimary} w-full`}>{savingEdit ? 'Saving…' : 'Save changes'}</button>
          </form>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete dealer?" onClose={() => { setShowDelete(false); setEditing(null); }}>
          <p className="text-sm text-slate-300">
            This removes <span className="font-bold text-white">{editing?.businessName || editing?.user?.dealershipName || 'this dealer'}</span> and they can no longer sign in.
            Any live cars they uploaded will be unpublished. Prefer Suspend if you only want to pause the account.
          </p>
          <div className="flex gap-2 mt-4">
            <button type="button" className={btnGhost} onClick={() => { setShowDelete(false); setEditing(null); }}>Cancel</button>
            <button type="button" className="bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl" onClick={deleteDealer}>Delete dealer</button>
          </div>
        </Modal>
      )}

      {createdCreds && (
        <Modal title="Share login with dealer" onClose={() => { setCreatedCreds(null); setRevealPassword(false); }}>
          <div className="space-y-3 text-sm">
            <p className="text-amber-300 text-xs font-bold">Password is hidden. Copy it and send to the dealer — it is not stored in plain text.</p>
            <p className="text-slate-400 text-xs">Dealer signs in at the dealer portal (<span className="font-mono text-slate-200">/dealer/login</span>), not the customer website.</p>
            <Field label="Dealer ID" value={createdCreds.dealerCode} />
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Password</p>
              <p className="text-sm font-semibold text-white mt-1 font-mono tracking-widest">
                {revealPassword ? createdCreds.password : '•'.repeat(Math.max(12, String(createdCreds.password || '').length))}
              </p>
              <button type="button" className="text-[11px] font-bold text-blue-400 mt-2" onClick={() => setRevealPassword((v) => !v)}>
                {revealPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>
            <button
              type="button"
              className={btnGhost}
              onClick={() => copyText(createdCreds.dealerCode, 'Dealer ID copied')}
            >
              Copy Dealer ID
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => copyText(createdCreds.password, 'Password copied')}
            >
              Copy password
            </button>
            <button
              type="button"
              className={`${btnPrimary} w-full`}
              onClick={() => copyText(`Dealer portal: /dealer/login\nDealer ID: ${createdCreds.dealerCode}\nPassword: ${createdCreds.password}`, 'Login copied')}
            >
              Copy Dealer ID + password
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function copyText(value, ok = 'Copied') {
  navigator.clipboard?.writeText(String(value || '')).then(() => toast.success(ok)).catch(() => toast.error('Could not copy'));
}

function makeStrongPassword(length = 12) {
  const size = Math.min(12, Math.max(8, Number(length) || 12));
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$%&*!';
  const all = upper + lower + digits + special;
  const pick = (set) => set[Math.floor(Math.random() * set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < size) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function isStrongPassword(password) {
  const value = String(password || '');
  return value.length >= 8 && value.length <= 12;
}

function Field({ label, value }) {
  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white mt-1">{value || '—'}</p>
    </div>
  );
}

function CheckField({ label, check }) {
  return (
    <div className={`border rounded-xl p-3 ${check?.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white mt-1">{check?.value || '—'}</p>
      <p className="text-[11px] mt-1 text-slate-400">{check?.message}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-slate-500">{label}</p>
      <p className="text-sm font-black text-white mt-1">{value}</p>
    </div>
  );
}
