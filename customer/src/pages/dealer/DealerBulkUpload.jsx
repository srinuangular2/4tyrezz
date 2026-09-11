import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { ProfileCard } from '../profile/ProfileLayout';

const HEADERS = ['registration_no', 'brand', 'model', 'variant', 'year', 'km_driven', 'price', 'fuel_type', 'transmission', 'city'];
const REG_RX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

function splitLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i += 1; } else q = !q;
    } else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line, idx) => {
    const cols = splitLine(line);
    const row = { _row: idx + 2 };
    headers.forEach((h, i) => { row[h] = String(cols[i] || '').trim(); });
    return row;
  });
}

function validate(row) {
  const errors = [];
  const reg = String(row.registration_no || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!REG_RX.test(reg)) errors.push('Invalid registration');
  if (!row.brand) errors.push('Missing brand');
  if (!row.model) errors.push('Missing model');
  if (!row.price || Number(row.price) <= 0) errors.push('Missing price');
  if (!row.year) errors.push('Missing year');
  return errors;
}

export default function DealerBulkUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const validCount = useMemo(() => rows.filter((r) => !r.errors?.length).length, [rows]);

  const loadFile = async (picked) => {
    if (!picked) return;
    const name = picked.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      toast.error('Save the Excel file as CSV and drop it here');
      return;
    }
    const text = await picked.text();
    const parsed = parseCsv(text).map((r) => ({ ...r, errors: validate(r) }));
    setFile(picked);
    setRows(parsed);
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
      toast.success(`${res.imported || 0} cars imported`);
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
        <p className="font-black text-slate-900">Drop CSV / Excel (CSV) here</p>
        <p className="text-xs font-semibold text-slate-400 mt-1">Headers: {HEADERS.join(', ')}</p>
        <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="sr-only" onChange={(e) => loadFile(e.target.files?.[0])} />
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
