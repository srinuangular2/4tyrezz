import { Link } from 'react-router-dom';

export default function PdiCta({ car, compact = false }) {
  const type = car ? 'used' : 'used';
  const query = new URLSearchParams({ type });
  if (car?.brand?.name) query.set('brand', car.brand.name);
  if (car?.model?.name) query.set('model', car.model.name);
  if (car?.city?.name || car?.location?.city) query.set('city', car.city?.name || car.location?.city);

  return (
    <Link
      to={`/inspection/book?${query.toString()}`}
      className={compact
        ? 'block w-full rounded-2xl border border-[#3083ff]/30 bg-blue-50 px-4 py-3 text-left'
        : 'block w-full rounded-2xl bg-[#0c2e68] text-white px-4 py-4 text-left'}
    >
      <p className={`text-[10px] font-black uppercase tracking-wider ${compact ? 'text-[#3083ff]' : 'text-blue-200'}`}>Pre-delivery inspection</p>
      <p className={`font-black mt-1 ${compact ? 'text-slate-900 text-sm' : 'text-base'}`}>Book a new or used car inspection</p>
      <p className={`text-xs mt-1 ${compact ? 'text-slate-500' : 'text-blue-100'}`}>300+ point check from ₹1,999. Report within 60 minutes.</p>
    </Link>
  );
}
