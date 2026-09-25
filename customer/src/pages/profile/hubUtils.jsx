import { formatINR } from '../../components/PageShell';

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

export function StatusPill({ value }) {
  const tone = String(value || '').toLowerCase();
  const cls = tone.includes('close') || tone.includes('cancel') || tone.includes('refund')
    ? 'bg-slate-100 text-slate-600'
    : tone.includes('complete') || tone.includes('confirm') || tone.includes('disburs') || tone.includes('resolv') || tone.includes('respond')
      ? 'bg-emerald-50 text-emerald-700'
      : tone.includes('document') || tone.includes('progress') || tone.includes('review') || tone.includes('pending')
        ? 'bg-amber-50 text-amber-700'
        : 'bg-blue-50 text-[#1853ff]';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {value || '—'}
    </span>
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
