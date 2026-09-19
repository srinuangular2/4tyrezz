import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import AddCarWizard from '../components/common/AddCarWizard';
import { FilterPills, PageHeader, StatusBadge, btnGhost, btnPrimary, inputCls, mediaSrc } from '../components/admin/ui';

function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function Moderation() {
  const [tab, setTab] = useState('queue');
  const [rows, setRows] = useState([]);
  const [flagged, setFlagged] = useState({ reviews: [], reports: [] });
  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const loadQueue = () => api.get('/admin/moderation/queue').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  const loadFlagged = () => api.get('/admin/moderation/flagged').then((r) => setFlagged(r.data.data || { reviews: [], reports: [] })).catch(() => {});

  useEffect(() => {
    loadQueue();
    loadFlagged();
  }, []);

  const closeInspect = () => {
    setItem(null);
    setShowReject(false);
    setRemarks('');
    setActiveImg(0);
  };

  const openInspect = async (row) => {
    setShowReject(false);
    setRemarks('');
    setActiveImg(0);
    setItem(row);
    setLoadingItem(true);
    try {
      const { data } = await api.get(`/cars/${row._id}`);
      setItem({ ...row, ...data, priceSanity: row.priceSanity || data.priceSanity });
    } catch {
      setItem(row);
    } finally {
      setLoadingItem(false);
    }
  };

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeInspect();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item]);

  const approve = async (id) => {
    try {
      await api.patch(`/admin/listings/${id}/approve`);
      toast.success('Listing published');
      closeInspect();
      loadQueue();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not approve');
    }
  };

  const reject = async () => {
    if (!item?._id) return;
    try {
      await api.patch(`/admin/listings/${item._id}/reject`, { remarks });
      toast.success('Dealer notified');
      closeInspect();
      loadQueue();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not reject');
    }
  };

  const images = useMemo(() => {
    const blocked = new Set(Object.values(item?.listingDocuments || {}).filter(Boolean));
    if (item?.inspectionReport) blocked.add(item.inspectionReport);
    const list = item?.photos?.length
      ? item.photos
      : [...(item?.images || []), ...Object.values(item?.mediaSlots || {}).filter(Boolean)];
    return Array.from(new Set(list)).filter((url) => url && !blocked.has(url) && !/\.pdf($|\?)/i.test(String(url)));
  }, [item]);

  const docs = Object.entries(item?.listingDocuments || {}).filter(([, url]) => url);

  const columns = [
    {
      key: 'title',
      label: 'Listing',
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.images?.[0] ? <img src={mediaSrc(c.images[0])} alt="" className="w-14 h-10 rounded-lg object-cover" /> : <span className="w-14 h-10 rounded-lg bg-slate-800" />}
          <div>
            <p className="font-semibold text-white">{c.title}</p>
            <p className="text-[11px] text-slate-500">{c.year} · {c.owner?.dealershipName || c.owner?.name}</p>
          </div>
        </div>
      ),
    },
    { key: 'price', label: 'Ask', render: (c) => inr(c.price) },
    { key: 'sanity', label: 'Price check', render: (c) => <StatusBadge value={c.priceSanity?.label} /> },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge value={c.listingStatus || c.status} /> },
    {
      key: 'open',
      label: '',
      render: (c) => (
        <button type="button" className="text-xs font-bold text-blue-400" onClick={() => openInspect(c)}>
          Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader kicker="Moderation" title="Listing inspection queue" subtitle="Open a listing to review photos, then walk identity, specs, health and media one step at a time." />
      <FilterPills
        value={tab}
        onChange={setTab}
        options={[
          { value: 'queue', label: 'Pending listings' },
          { value: 'flagged', label: 'Flagged / reported' },
        ]}
      />

      {tab === 'queue' && <DataTable columns={columns} rows={rows} page={1} pages={1} onPageChange={loadQueue} />}

      {tab === 'flagged' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Reported ads</h3>
            <DataTable
              columns={[
                { key: 'car', label: 'Car', render: (r) => r.car?.title || '—' },
                { key: 'reason', label: 'Reason' },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
              ]}
              rows={flagged.reports || []}
              page={1}
              pages={1}
              onPageChange={loadFlagged}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Reviews awaiting moderation</h3>
            <DataTable
              columns={[
                { key: 'user', label: 'User', render: (r) => r.user?.name || '—' },
                { key: 'comment', label: 'Comment' },
                {
                  key: 'act',
                  label: '',
                  render: (r) => (
                    <button type="button" className="text-xs font-bold text-emerald-400" onClick={async () => { await api.patch(`/admin/reviews/${r._id}`, { status: 'approved' }); loadFlagged(); }}>
                      Approve
                    </button>
                  ),
                },
              ]}
              rows={flagged.reviews || []}
              page={1}
              pages={1}
              onPageChange={loadFlagged}
            />
          </div>
        </div>
      )}

      {item && (
        <div className="fixed inset-0 z-[90] bg-[#070b14] text-white flex flex-col">
          <header className="shrink-0 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur-xl">
            <div className="px-4 sm:px-6 py-3.5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={closeInspect}
                className="h-10 px-3 rounded-xl border border-white/10 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5"
              >
                ← Queue
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Quality inspection</p>
                <h1 className="font-display font-black text-lg sm:text-xl truncate">{item.title || 'Listing'}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={item.listingStatus || item.status} />
                <StatusBadge value={item.priceSanity?.label} />
                <button type="button" className={`${btnGhost} h-10`} onClick={() => setShowReject((v) => !v)}>Reject</button>
                <button type="button" className={`${btnPrimary} h-10`} onClick={() => approve(item._id)}>Approve & publish</button>
                <button type="button" aria-label="Close" onClick={closeInspect} className="w-10 h-10 rounded-xl border border-white/10 text-slate-400 hover:text-white font-black">✕</button>
              </div>
            </div>
            {showReject && (
              <div className="px-4 sm:px-6 pb-4">
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-rose-300 mb-2">Send back to dealer</p>
                  <textarea
                    className={inputCls}
                    rows={3}
                    placeholder="What must change before this can go live?"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <div className="flex gap-2 mt-3">
                    <button type="button" className={`${btnPrimary} bg-rose-600 hover:bg-rose-500`} onClick={reject}>Send remarks</button>
                    <button type="button" className={btnGhost} onClick={() => setShowReject(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </header>

          <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(280px,38%)_minmax(0,1fr)]">
            <aside className="border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto p-4 sm:p-6 bg-[#0b1220]">
              <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
                {images[activeImg] ? (
                  <img src={mediaSrc(images[activeImg])} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-semibold">No photos yet</div>
                )}
              </div>
              {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 rounded-lg overflow-hidden border ${activeImg === i ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                    >
                      <img src={mediaSrc(src)} alt="" className="w-16 h-12 object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-5">
                <Fact label="Ask" value={inr(item.price)} />
                <Fact label="KM" value={Number(item.kmDriven || 0).toLocaleString('en-IN')} />
                <Fact label="Fuel / gear" value={[item.fuel, item.transmission].filter(Boolean).join(' · ') || '—'} />
                <Fact label="Owner" value={item.ownership ? `${item.ownership}${item.ownership === 1 ? 'st' : item.ownership === 2 ? 'nd' : 'th'}` : '—'} />
                <Fact label="Registration" value={item.rtoDetails?.rcNumber || item.rto || '—'} />
                <Fact label="Dealer" value={item.owner?.dealershipName || item.owner?.name || '—'} />
              </div>

              {docs.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {docs.map(([key, url]) => (
                      <a
                        key={key}
                        href={mediaSrc(url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-black uppercase tracking-wider rounded-lg border border-white/10 px-3 py-2 text-blue-300 hover:text-white"
                      >
                        {key.replace(/([A-Z])/g, ' $1')}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            <section className="overflow-y-auto p-4 sm:p-8 bg-gradient-to-b from-[#0e1628] to-[#070b14]">
              <div className="max-w-3xl mx-auto">
                <div className="mb-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-400">Review in 4 steps</p>
                  <h2 className="font-display font-black text-2xl mt-1">Correct details, then publish</h2>
                  <p className="text-sm text-slate-400 mt-1">One section at a time — same flow as listing a car. Save on the last step, then approve.</p>
                </div>
                {loadingItem ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400 font-semibold">Loading listing file…</div>
                ) : (
                  <AddCarWizard
                    variant="admin"
                    editId={item._id}
                    embedded
                    afterSave={() => {
                      toast.success('Listing details saved');
                      loadQueue();
                    }}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-bold text-white mt-1 truncate">{value}</p>
    </div>
  );
}
