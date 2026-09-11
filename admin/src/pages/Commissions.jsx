import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { FilterPills, GlassCard, PageHeader, StatusBadge, btnPrimary, inr, inputCls } from '../components/admin/ui';

export default function Commissions() {
  const [rows, setRows] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [tab, setTab] = useState('pending');
  const [settings, setSettings] = useState({ commissionRatePercent: 2.5, leadChargeFixed: 0 });

  const load = () => {
    api.get('/admin/commissions', { params: { status: tab === 'ledger' ? undefined : tab, limit: 50 } })
      .then((r) => setRows(r.data.data || []))
      .catch(() => setRows([]));
    api.get('/admin/commissions/ledger').then((r) => setLedger(r.data.data || [])).catch(() => setLedger([]));
    api.get('/admin/settings').then((r) => setSettings(r.data.data || settings)).catch(() => {});
  };

  useEffect(() => { load(); }, [tab]);

  const saveConfig = async () => {
    await api.put('/admin/settings', settings);
    toast.success('Commission structure saved');
  };

  const settle = async (id) => {
    await api.post(`/admin/commissions/${id}/settle`);
    toast.success('Settlement processed');
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader kicker="Payouts" title="Commissions" subtitle="Percent-of-sale or fixed lead charge, plus dealer settlement ledger." />
      <GlassCard className="p-5 grid md:grid-cols-3 gap-3 items-end">
        <label className="text-xs font-bold text-slate-400">
          % per sale
          <input className={`${inputCls} mt-1`} type="number" step="0.1" value={settings.commissionRatePercent} onChange={(e) => setSettings({ ...settings, commissionRatePercent: Number(e.target.value) })} />
        </label>
        <label className="text-xs font-bold text-slate-400">
          Fixed lead charge (₹)
          <input className={`${inputCls} mt-1`} type="number" value={settings.leadChargeFixed} onChange={(e) => setSettings({ ...settings, leadChargeFixed: Number(e.target.value) })} />
        </label>
        <button type="button" className={btnPrimary} onClick={saveConfig}>Save structure</button>
      </GlassCard>
      <FilterPills
        value={tab}
        onChange={setTab}
        options={[
          { value: 'pending', label: 'Pending payout' },
          { value: 'approved', label: 'Approved' },
          { value: 'paid', label: 'Paid' },
          { value: 'ledger', label: 'Settlement ledger' },
        ]}
      />
      {tab === 'ledger' ? (
        <DataTable
          rows={ledger}
          page={1}
          pages={1}
          onPageChange={() => {}}
          columns={[
            { key: 'dealer', label: 'Dealer', render: (r) => r.dealer?.dealershipName || r.dealer?.name },
            { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
            { key: 'ref', label: 'Ref', render: (r) => r.payoutRef },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            { key: 'at', label: 'Processed', render: (r) => r.processedAt ? new Date(r.processedAt).toLocaleString() : '—' },
          ]}
        />
      ) : (
        <DataTable
          rows={rows}
          page={1}
          pages={1}
          onPageChange={load}
          columns={[
            { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.title || '—' },
            { key: 'dealer', label: 'Dealer', render: (r) => r.dealer?.dealershipName || r.dealer?.name },
            { key: 'sale', label: 'Sale', render: (r) => inr(r.salePrice) },
            { key: 'amount', label: 'Commission', render: (r) => `${inr(r.amount)} (${r.ratePercent}%)` },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            {
              key: 'act',
              label: '',
              render: (r) => r.status !== 'paid' ? (
                <button type="button" className="text-xs font-bold text-emerald-400" onClick={() => settle(r._id)}>Process settlement</button>
              ) : null,
            },
          ]}
        />
      )}
    </div>
  );
}
