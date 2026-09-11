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
  const [form, setForm] = useState({ name: '', email: '', password: '', dealershipName: '', city: '' });

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

  const addDealer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register-dealer', form);
      setShowAdd(false);
      load(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create dealer');
    }
  };

  const columns = [
    { key: 'business', label: 'Dealership', render: (r) => r.businessName || r.user?.dealershipName || r.user?.name || '—' },
    { key: 'gst', label: 'GSTIN', render: (r) => r.gstNumber || '—' },
    { key: 'city', label: 'City', render: (r) => r.city || r.user?.city || '—' },
    { key: 'kyc', label: 'KYC', render: (r) => <StatusBadge value={r.kycStatus} /> },
    { key: 'account', label: 'Account', render: (r) => <StatusBadge value={r.user?.isActive === false ? 'Suspended' : 'Active'} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button type="button" className="text-xs font-bold text-blue-400" onClick={() => openReview(r)}>
          Review
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Onboarding"
        title="Dealers"
        subtitle="KYC queue, GST/PAN checks, and account controls."
        actions={<button type="button" className={btnPrimary} onClick={() => setShowAdd(true)}>+ Add dealer</button>}
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
        <Modal title="Add dealer" onClose={() => setShowAdd(false)}>
          <form onSubmit={addDealer} className="space-y-3">
            <input required placeholder="Contact name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required placeholder="Dealership name" className={inputCls} value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} />
            <input required type="email" placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required type="password" placeholder="Temporary password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input placeholder="City" className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <button className={`${btnPrimary} w-full`}>Create dealer account</button>
          </form>
        </Modal>
      )}
    </div>
  );
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
