import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { fetchWishlist } from '../../app/wishlistSlice';
import { formatINR } from '../../components/PageShell';
import { addCompare } from '../../lib/compareTray';
import { COMPANY_WHATSAPP } from '../../lib/companyContact';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { mediaUrl } from './hubUtils';

function imgSrc(car) {
  return mediaUrl(car?.images?.[0]);
}

export default function ProfileWishlist() {
  const dispatch = useDispatch();
  const [cars, setCars] = useState(null);
  const [consents, setConsents] = useState(null);

  const load = () =>
    api
      .get('/user/wishlist')
      .then((r) => setCars(r.data.data || []))
      .catch(() => setCars([]));

  useEffect(() => {
    load();
    api
      .get('/user/consents')
      .then((r) => setConsents(r.data.data))
      .catch(() => setConsents({ wishlistPriceDrop: true, wishlistAvailability: true }));
  }, []);

  const toggleConsent = async (key) => {
    const next = { ...consents, [key]: !consents[key] };
    setConsents(next);
    try {
      const { data } = await api.put('/user/consents', next);
      setConsents(data.data);
      toast.success('Alert preference saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save preference');
    }
  };

  const remove = async (car) => {
    try {
      await api.post('/user/wishlist/toggle', { carId: car._id });
      setCars((list) => (list || []).filter((c) => c._id !== car._id));
      dispatch(fetchWishlist());
      toast.success('Removed from shortlist');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not remove');
    }
  };

  const contact = (car) => {
    const title = `${car?.year || ''} ${car?.brand?.name || ''} ${car?.model?.name || car?.title || 'car'}`.trim();
    const ref = String(car?._id || '').slice(-6).toUpperCase();
    const text = `Hi, I am interested in ${title} (Ref: #4T${ref}). Is it available?`;
    window.open(`https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <ProfileCard eyebrow="Saved" title="Shortlisted vehicles">
      {consents && (
        <div className="mb-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 px-4 py-3 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[#3083ff]"
              checked={consents.wishlistPriceDrop !== false}
              onChange={() => toggleConsent('wishlistPriceDrop')}
            />
            Price-drop alerts
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[#3083ff]"
              checked={consents.wishlistAvailability !== false}
              onChange={() => toggleConsent('wishlistAvailability')}
            />
            Availability alerts
          </label>
        </div>
      )}
      {cars === null && <p className="text-sm font-semibold text-slate-500">Loading shortlist…</p>}
      {cars && cars.length === 0 && (
        <EmptyNote>
          Nothing shortlisted yet.{' '}
          <Link to="/cars" className="text-[#3083ff] font-black">Find cars</Link>
        </EmptyNote>
      )}
      {cars && cars.length > 0 && (
        <div className="space-y-3">
          {cars.map((car) => (
            <article
              key={car._id}
              className="flex gap-3 overflow-hidden rounded-[22px] bg-white p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              <Link to={`/cars/${car._id}`} className="relative w-[108px] h-[80px] lg:w-[148px] lg:h-[104px] rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {imgSrc(car) ? (
                  <img src={imgSrc(car)} alt={car.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[20px]">🚗</span>
                )}
                {car.sold && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase bg-slate-900 text-white px-1.5 py-0.5 rounded-full">Sold</span>
                )}
                {!car.sold && car.unavailable && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Unavailable</span>
                )}
              </Link>
              <div className="min-w-0 flex-1 py-0.5">
                <Link to={`/cars/${car._id}`} className="block text-[13px] font-semibold text-slate-900 leading-snug line-clamp-1 hover:text-[#1853ff]">
                  {car.title}
                </Link>
                <p className="text-[13px] font-bold text-[#1853ff] mt-0.5">{formatINR(car.price)}</p>
                {car.priceDrop > 0 && (
                  <p className="text-[11px] font-medium text-emerald-600">Down {formatINR(car.priceDrop)}</p>
                )}
                <p className="text-[12px] font-normal text-slate-500 mt-0.5 line-clamp-1">
                  {[car.year, car.fuel, car.transmission, car.kmDriven != null ? `${Number(car.kmDriven).toLocaleString('en-IN')} km` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <button type="button" onClick={() => contact(car)} className="text-[12px] font-semibold text-[#3083ff]">
                    Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const result = addCompare(car);
                      if (result.full) toast.error('Compare tray is full (4 cars)');
                      else toast.success(result.already ? 'Already in compare' : 'Added to compare');
                    }}
                    className="text-[12px] font-medium text-slate-500"
                  >
                    Compare
                  </button>
                  <button type="button" onClick={() => remove(car)} className="text-[12px] font-semibold text-rose-500 ml-auto">
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
