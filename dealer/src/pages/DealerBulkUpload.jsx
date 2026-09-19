import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ProfileCard } from '../components/ui';

const HEADERS = ['registration_no', 'brand', 'model', 'variant', 'year', 'km_driven', 'price', 'fuel_type', 'transmission', 'city'];

export default function DealerBulkUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const validCount = useMemo(() => rows.filter((r) => !r.errors?.length).length, [rows]);

  const loadFile = async (picked) => {
    if (!picked) return;
    setFile(picked);
    try {
      const data = new FormData();
      data.append('file', picked);
      const { data: res } = await api.post('/dealer/inventory/bulk-import', data);
      const preview = res.preview || [];
      setRows(preview.map((r) => ({
        _row: r.row,
        registration_no: r.registration_no || '',
        brand: r.brand || '',
        model: r.model || '',
        variant: r.variant || '',
        year: r.year || '',
        km_driven: r.km_driven || '',
        price: r.price || '',
        fuel_type: r.fuel_type || '',
        transmission: r.transmission || '',
        city: r.city || '',
        errors: r.errors || [],
      })));
      if (!preview.length) toast.error('No data rows found in this file');
    } catch (e) {
      setRows([]);
      toast.error(e.response?.data?.message || 'Could not read this file');
    }
  };

  const downloadTemplate = () => {
    const body = `${HEADERS.join(',')}\nTS09AB1234,Maruti,Swift,VXI,2021,32000,575000,Petrol,Manual,Hyderabad\n`;
    const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '4tyrezz_bulk_inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importValid = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('confirm', 'true');
      const { data: res } = await api.post('/dealer/inventory/bulk-import', data);
      const imported = Number(res.imported || 0);
      const failed = Number(res.failed || 0);
      if (imported) toast.success(`${imported} cars imported${failed ? `, ${failed} failed` : ''}`);
      else toast.error(res.rowErrors?.[0]?.message || '0 cars imported');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ProfileCard
      eyebrow="Inventory"
      title="Bulk upload"
      action={<button type="button" onClick={downloadTemplate} className="text-xs font-black uppercase tracking-wider text-[#3083ff]">Download CSV template</button>}
    >
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files?.[0]); }}
        className="block rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center cursor-pointer hover:border-[#3083ff]"
      >
        <p className="font-black text-slate-900">Drop CSV, Excel or ODS here</p>
        <p className="text-xs font-semibold text-slate-400 mt-1">Accepted: .csv .xlsx .xls .ods .tsv .txt · Headers: {HEADERS.join(', ')}</p>
        <input
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.xlsb,.ods,.xml,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
          className="sr-only"
          onChange={(e) => loadFile(e.target.files?.[0])}
        />
      </label>

      {rows.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-600">{validCount}/{rows.length} valid rows</p>
            <button type="button" disabled={!validCount || importing} onClick={importValid} className="bg-[#3083ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-4 py-2.5 disabled:opacity-50">
              {importing ? 'Importing…' : 'Import valid cars'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr>{['Row', ...HEADERS, 'Issues'].map((h) => <th key={h} className="text-left py-2 pr-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._row} className={r.errors.length ? 'bg-rose-50 text-rose-700' : 'border-t border-slate-100'}>
                    <td className="py-2 pr-3 font-bold">{r._row}</td>
                    {HEADERS.map((h) => <td key={h} className="py-2 pr-3">{r[h] || '—'}</td>)}
                    <td className="py-2">{r.errors.join(', ') || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ProfileCard>
  );
}
