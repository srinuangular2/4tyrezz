import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import DataTable from '../DataTable';
import { FilterPills, PageHeader, StatusBadge, inputCls } from './ui';
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts';

const selectCls =
  'bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-100 outline-none focus:border-blue-500/60 max-w-[180px]';

export default function OpsTable({
  title,
  kicker,
  subtitle,
  endpoint,
  filters = [],
  filterKey = 'status',
  columns,
  statusPatch,
  quickActions,
}) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const alerts = useRealtimeAlerts();

  const load = async (page = 1) => {
    const { data } = await api.get(endpoint, {
      params: { page, limit: 20, [filterKey]: filter || undefined, search: search || undefined },
    });
    setRows(data.data || data.users || []);
    setMeta({ page: data.page || 1, pages: data.pages || data.totalPages || 1 });
  };

  useEffect(() => { load(1); }, [filter, endpoint]);

  const patchStatus = async (row, next) => {
    if (!statusPatch || !next || busyId) return;
    const field = statusPatch.field || 'status';
    if (row[field] === next) return;
    const path = typeof statusPatch.path === 'function' ? statusPatch.path(row) : statusPatch.path;
    const bodyKey = statusPatch.bodyKey || field;
    setBusyId(row._id);
    try {
      await api.patch(path, { [bodyKey]: next });
      setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, [field]: next } : r)));
      toast.success('Status updated');
      alerts?.refresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    } finally {
      setBusyId('');
    }
  };

  const tableColumns = [...columns];
  if (statusPatch) {
    const field = statusPatch.field || 'status';
    tableColumns.push({
      key: `_patch_${field}`,
      label: statusPatch.label || 'Update',
      render: (row) => {
        const current = row[field] || '';
        const options = statusPatch.options.includes(current) || !current
          ? statusPatch.options
          : [current, ...statusPatch.options];
        return (
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <div className="flex items-center gap-2">
              <StatusBadge value={current} />
              <select
                className={selectCls}
                value={current}
                disabled={busyId === row._id}
                onChange={(e) => patchStatus(row, e.target.value)}
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {quickActions?.(row, (status) => patchStatus(row, status), busyId === row._id)}
          </div>
        );
      },
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader kicker={kicker} title={title} subtitle={subtitle} />
      <div className="flex flex-wrap gap-3 items-center">
        {filters.length > 0 && <FilterPills value={filter} onChange={setFilter} options={filters} />}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search…"
          className={`${inputCls} max-w-xs`}
        />
      </div>
      <DataTable columns={tableColumns} rows={rows} page={meta.page} pages={meta.pages} onPageChange={load} />
    </div>
  );
}

export const badgeCol = (key, label = 'Status') => ({
  key,
  label,
  render: (r) => <StatusBadge value={r[key]} />,
});
