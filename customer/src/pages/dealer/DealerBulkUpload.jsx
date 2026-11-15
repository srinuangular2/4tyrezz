import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { GlassCard, PageHeader, btnPrimary } from '../../components/dealer/ui';

const HEADERS = ['registration_no', 'brand', 'model', 'variant', 'year', 'km_driven', 'fuel_type', 'transmission', 'price', 'owners', 'city', 'state', 'pincode', 'car_location', 'upload_address', 'body_type', 'color', 'description', 'images', 'features', 'status'];
const SAMPLE = 'TS09FA4821,Maruti Suzuki,Swift,ZXI,2021,32000,PETROL,MANUAL,575000,1,Hyderabad,Telangana,500081,Gachibowli,Plot 12 Gachibowli,Hatchback,White,Well maintained,,ABS|Sunroof,AVAILABLE';

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
        owners: r.owners || r.ownership || '',
        city: r.city || '',
        state: r.state || '',
        pincode: r.pincode || '',
        car_location: r.car_location || '',
        upload_address: r.upload_address || '',
        body_type: r.body_type || '',
        color: r.color || '',
        description: r.description || '',
        images: Array.isArray(r.images) ? r.images.join('|') : (r.images || ''),
        features: Array.isArray(r.features) ? r.features.join('|') : (r.features || ''),
        status: r.status || '',
        errors: r.errors || [],
      })));
      if (!preview.length) toast.error('No data rows found in this file');
    } catch (e) {
      setRows([]);
      toast.error(e.response?.data?.message || 'Could not read this file');
    }
  };

  const downloadTemplate = () => {
    const body = `${HEADERS.join(',')}\n${SAMPLE}\n`;
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
      const rowErrors = res.rowErrors || [];
      if (rowErrors.length) {
        setRows((current) => current.map((row) => {
          const hit = rowErrors.find((err) => Number(err.row) === Number(row._row));
          return hit ? { ...row, errors: [hit.message] } : row;
        }));
      }
      if (imported) toast.success(`${imported} cars imported${failed ? `, ${failed} failed` : ''}`);
      else toast.error(rowErrors[0]?.message || '0 cars imported. Check the Issues column.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="-mx-3 -mt-3 bg-[#3083ff] px-4 py-4 text-white lg:hidden">
        <p className="text-[12px] font-normal text-white/80">Many cars at once</p>
        <h1 className="text-[18px] font-medium">Bulk upload</h1>
      </div>
      <div className="hidden lg:block">
      <PageHeader
        kicker="Inventory"
        title="Bulk upload"
        actions={<button type="button" onClick={downloadTemplate} className="text-xs font-black uppercase tracking-wider text-[#3083ff]">Download template</button>}
      />
      </div>
      <GlassCard className="p-4 sm:p-5">
      <div className="mb-3 rounded-[20px] border border-white bg-gradient-to-b from-[#eaf2ff] to-white p-3 lg:hidden">
        <p className="text-[13px] font-medium text-slate-800">Add a spreadsheet of your stock.</p>
        <p className="mt-1 text-[12px] font-normal text-slate-500">Use the template so each row becomes a car. CSV, Excel and ODS files work.</p>
        <button type="button" onClick={downloadTemplate} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[13px] font-medium text-[#1853ff]"><FileSpreadsheet className="h-4 w-4" /> Download template</button>
      </div>
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files?.[0]); }}
        className="block cursor-pointer rounded-[22px] border-2 border-dashed border-[#3083ff]/40 bg-[#f4f8ff] p-8 text-center"
      >
        <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#3083ff]"><Upload className="h-5 w-5" /></span>
        <p className="text-[15px] font-medium text-slate-900">Choose a file</p>
        <p className="mt-1 text-[12px] font-normal text-slate-500">.csv, .xlsx, .xls or .ods</p>
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
            <button type="button" disabled={!validCount || importing} onClick={importValid} className={`${btnPrimary} disabled:opacity-50`}>
              {importing ? 'Importing…' : 'Import valid cars'}
            </button>
          </div>
          <div className="space-y-2 lg:hidden">
            {rows.map((r) => (
              <div key={r._row} className={`rounded-2xl px-3 py-3 ${r.errors?.length ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'}`}>
                <p className="text-[14px] font-semibold">{r.brand} {r.model} {r.variant}</p>
                <p className="mt-0.5 text-[12px]">Row {r._row} · {r.year || '—'} · ₹{Number(r.price || 0).toLocaleString('en-IN')}</p>
                <p className="mt-1 text-[12px]">{r.errors?.join(', ') || 'Ready to import'}</p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-xs">
              <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr>{['Row', ...HEADERS, 'Issues'].map((h) => <th key={h} className="text-left py-2 pr-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._row} className={r.errors?.length ? 'bg-rose-50 text-rose-700' : 'border-t border-slate-100 text-slate-700'}>
                    <td className="py-2 pr-3 font-bold">{r._row}</td>
                    {HEADERS.map((h) => <td key={h} className="py-2 pr-3">{r[h] || '—'}</td>)}
                    <td className="py-2">{r.errors?.join(', ') || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </GlassCard>
    </div>
  );
}
