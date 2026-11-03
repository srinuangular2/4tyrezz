import { formatINR } from '../../components/PageShell';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateParts(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDateLabel(value, short = false) {
  const date = dateParts(value);
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = (short ? MONTHS_SHORT : MONTHS)[date.getMonth()];
  return `${month} ${day}, ${date.getFullYear()}`;
}

export function formatWhen(value, short = false) {
  const date = dateParts(value);
  if (!date) return '';
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${formatDateLabel(date, short)} · ${hours}:${minutes} ${suffix}`;
}

export function mediaUrl(path) {
  if (!path) return '';
  // Rewrite legacy absolute localhost URLs so phones on LAN still work
  const rewritten = String(path).replace(/^https?:\/\/localhost(:\d+)?/i, '');
  if (/^https?:\/\//i.test(rewritten) || rewritten.startsWith('data:')) return rewritten;
  const normalized = rewritten.startsWith('/') ? rewritten : `/${rewritten}`;
  // Only prefix an absolute API origin when explicitly set (e.g. production).
  // Locally / on LAN, use relative /uploads so Vite proxy works from phone too.
  const origin = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');
  return origin ? `${origin}${normalized}` : normalized;
}

export function describeFilters(filters = {}, fallback = 'Saved search') {
  const bits = [];
  if (filters.transmission) bits.push(filters.transmission);
  if (filters.bodyType) bits.push(filters.bodyType);
  if (filters.fuel) bits.push(filters.fuel);
  if (filters.brand) bits.push(filters.brand);
  if (filters.model) bits.push(filters.model);
  if (filters.color) bits.push(filters.color);
  if (filters.seats) bits.push(`${filters.seats} seater`);
  if (filters.rto) bits.push(`RTO ${filters.rto}`);
  if (filters.city) bits.push(`in ${filters.city}`);
  if (filters.maxPrice) {
    const lakhs = Number(filters.maxPrice) / 100000;
    bits.push(`under ${Number.isFinite(lakhs) ? `₹${lakhs}L` : formatINR(filters.maxPrice)}`);
  }
  return bits.join(' ') || fallback;
}

const STATUS_COLORS = {
  new: '#3083ff',
  'new lead': '#0ea5e9',
  submitted: '#6366f1',
  requested: '#14b8a6',
  assigned: '#8b5cf6',
  'in progress': '#0284c7',
  quoted: '#d946ef',
  'dealer responded': '#059669',
  'under review': '#d97706',
  'pre-approved': '#65a30d',
  'documents required': '#ea580c',
  disbursed: '#10b981',
  'follow-up': '#ec4899',
  'follow-up scheduled': '#db2777',
  'inspection / offer': '#0891b2',
  purchased: '#16a34a',
  exchanged: '#0f766e',
  closed: '#64748b',
  rejected: '#e11d48',
  completed: '#22c55e',
  confirmed: '#15803d',
  'payment pending': '#f97316',
  booked: '#2563eb',
  'token booked': '#7c3aed',
  'token received': '#6d28d9',
  'financing pending': '#ca8a04',
  'fully paid': '#047857',
  cancelled: '#be123c',
  'waiting for payment': '#f97316',
  'request received': '#3083ff',
  'slot confirmed': '#059669',
  'inspector is on the way': '#0284c7',
  'report is ready': '#16a34a',
  'cancelled/refunded': '#9f1239',
  refunded: '#78716c',
  contacted: '#06b6d4',
  negotiation: '#c026d3',
  sold: '#166534',
  lost: '#b91c1c',
  'closed/won': '#14532d',
  'test drive scheduled': '#4f46e5',
  'test drive booked': '#4338ca',
  verified: '#0d9488',
  'in review': '#f59e0b',
  'active bids': '#1d4ed8',
  pending: '#fb923c',
  paid: '#34d399',
  resolved: '#2dd4bf',
  open: '#38bdf8',
};

const STATUS_FALLBACK = ['#3083ff', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#10b981', '#14b8a6'];

function statusColor(value) {
  const key = String(value || '').trim().toLowerCase();
  if (STATUS_COLORS[key]) return STATUS_COLORS[key];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return STATUS_FALLBACK[hash % STATUS_FALLBACK.length];
}

export function StatusPill({ value }) {
  return (
    <span
      className="inline-flex max-w-[76px] shrink-0 items-center justify-center rounded-tr-[22px] px-1.5 py-1 text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-white"
      style={{ backgroundColor: statusColor(value) }}
    >
      {value || '—'}
    </span>
  );
}

const CARD_TONES = [
  'from-[#ffe8d6] to-[#fff6ee]',
  'from-[#d9ecff] to-[#f3f9ff]',
  'from-[#d8f6ea] to-[#f3fff8]',
  'from-[#efe4ff] to-[#faf7ff]',
  'from-[#fff1c9] to-[#fffaf0]',
  'from-[#ffe0ea] to-[#fff7f9]',
  'from-[#e0e7ff] to-[#f5f7ff]',
];

export function cardTone(index = 0) {
  return CARD_TONES[index % CARD_TONES.length];
}

export function VehicleCard({ image, title, price, facts, when, note, status, children }) {
  return (
    <article className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      {status ? <div className="absolute top-0 right-0 z-10">{status}</div> : null}
      <div className="flex gap-3 p-3 lg:gap-4 lg:p-4">
        <div className="w-[104px] h-[78px] lg:w-[148px] lg:h-[108px] rounded-xl bg-slate-100 overflow-hidden shrink-0">
          {image ? (
            <img src={mediaUrl(image)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[22px]">🚗</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2 ${status ? 'pr-16' : ''}`}>{title}</p>
          {price ? <p className="text-[13px] font-bold text-[#1853ff] mt-0.5">{price}</p> : null}
          {facts ? <p className="text-[12px] font-normal text-slate-500 mt-0.5 leading-snug">{facts}</p> : null}
          {when ? <p className="text-[11px] font-normal text-slate-400 mt-1">{when}</p> : null}
        </div>
      </div>
      {note ? <p className="px-3 pb-2 text-[12px] font-normal text-slate-600 leading-relaxed">{note}</p> : null}
      {children ? <div className="px-3 pb-3 flex flex-wrap gap-x-3 gap-y-1">{children}</div> : null}
    </article>
  );
}

export function DataCard({ emoji = '📄', image, title, meta, detail, status, children }) {
  return (
    <article className="relative overflow-hidden rounded-[22px] bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:hidden">
      {status ? <div className="absolute top-0 right-0 z-10">{status}</div> : null}
      <div className="flex items-start gap-3">
        {image ? (
          <span className="w-[88px] h-[66px] rounded-xl bg-slate-100 overflow-hidden shrink-0">
            <img src={mediaUrl(image)} alt="" className="w-full h-full object-cover" />
          </span>
        ) : (
          <span className="w-11 h-11 rounded-2xl bg-slate-50 shadow-sm inline-flex items-center justify-center text-[22px] shrink-0">{emoji}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-semibold text-slate-900 leading-snug ${status ? 'pr-16' : ''}`}>{title}</p>
          {meta ? <p className="text-[12px] font-normal text-slate-500 mt-1">{meta}</p> : null}
          {detail ? <p className="text-[12px] font-normal text-slate-600 mt-1 leading-relaxed">{detail}</p> : null}
          {children ? <div className="mt-2.5">{children}</div> : null}
        </div>
      </div>
    </article>
  );
}

export async function compressImage(file, max = 720) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Could not compress image');
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}
