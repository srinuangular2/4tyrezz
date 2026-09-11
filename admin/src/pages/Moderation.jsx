import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Drawer, FilterPills, PageHeader, StatusBadge, btnGhost, btnPrimary, inputCls, mediaSrc } from '../components/admin/ui';

export default function Moderation() {
  const [tab, setTab] = useState('queue');
  const [rows, setRows] = useState([]);
  const [flagged, setFlagged] = useState({ reviews: [], reports: [] });
  const [item, setItem] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const loadQueue = () => api.get('/admin/moderation/queue').then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  const loadFlagged = () => api.get('/admin/moderation/flagged').then((r) => setFlagged(r.data.data || { reviews: [], reports: [] })).catch(() => {});

  useEffect(() => {
    loadQueue();
    loadFlagged();
  }, []);

  const approve = async (id) => {
    await api.patch(`/admin/listings/${id}/approve`);
    toast.success('Listing published');
    setItem(null);
    loadQueue();
  };

  const reject = async () => {
    await api.patch(`/admin/listings/${item._id}/reject`, { remarks });
    toast.success('Dealer notified');
    setShowReject(false);
    setItem(null);
    loadQueue();
  };

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
    { key: 'price', label: 'Ask', render: (c) => `₹${Number(c.price || 0).toLocaleString('en-IN')}` },
    { key: 'sanity', label: 'Price check', render: (c) => <StatusBadge value={c.priceSanity?.label} /> },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge value={c.listingStatus || c.status} /> },
    {
      key: 'open',
      label: '',
      render: (c) => (
        <button type="button" className="text-xs font-bold text-blue-400" onClick={() => { setItem(c); setActiveImg(0); }}>
          Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader kicker="Moderation" title="Listing inspection queue" subtitle="PENDING_MODERATION listings, price sanity, and reported content." />
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
        <Drawer title={item.title} onClose={() => setItem(null)} wide>
          <div className="space-y-4">
            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900">
              {item.videoUrl && activeImg === 'video' ? (
                /youtu/.test(item.videoUrl) ? (
                  <iframe title="walkaround" src={item.videoUrl.replace('watch?v=', 'embed/')} className="w-full h-full" />
                ) : (
                  <video src={mediaSrc(item.videoUrl)} controls className="w-full h-full object-cover" />
                )
              ) : item.images?.[activeImg] ? (
                <img src={mediaSrc(item.images[activeImg])} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">No media</div>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {item.videoUrl && (
                <button type="button" onClick={() => setActiveImg('video')} className="w-16 h-12 rounded-lg bg-slate-800 text-[10px] font-bold text-white">Video</button>
              )}
              {(item.images || []).map((img, i) => (
                <button type="button" key={img + i} onClick={() => setActiveImg(i)}>
                  <img src={mediaSrc(img)} alt="" className={`w-16 h-12 rounded-lg object-cover ${activeImg === i ? 'ring-2 ring-blue-500' : 'opacity-70'}`} />
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <p className="text-slate-400">Registration <span className="text-white font-bold">{item.rto || item.rtoDetails?.rcNumber || '—'}</span></p>
              <p className="text-slate-400">Price sanity <StatusBadge value={item.priceSanity?.label} /></p>
              <p className="text-slate-400">KM <span className="text-white font-bold">{Number(item.kmDriven || 0).toLocaleString('en-IN')}</span></p>
              <p className="text-slate-400">Owner <span className="text-white font-bold">{item.owner?.email || item.owner?.name}</span></p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={btnPrimary} onClick={() => approve(item._id)}>Approve listing</button>
              <button type="button" className={btnGhost} onClick={() => setShowReject(true)}>Reject with remarks</button>
            </div>
          </div>
        </Drawer>
      )}

      {showReject && (
        <Modal title="Reject listing" onClose={() => setShowReject(false)}>
          <textarea className={inputCls} rows={4} placeholder="Tell the dealer what to fix (photos, description, price)…" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <button type="button" className={`${btnPrimary} w-full mt-3 bg-rose-600`} onClick={reject}>Send remarks</button>
        </Modal>
      )}
    </div>
  );
}
