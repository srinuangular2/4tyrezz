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
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cars.map((car) => (
            <article
              key={car._id}
              className="rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 overflow-hidden"
            >
              <Link to={`/cars/${car._id}`}>
                <div className="h-36 bg-slate-100 relative">
                  {imgSrc(car) ? (
                    <img src={imgSrc(car)} alt={car.title} className="w-full h-full object-cover" />
                  ) : null}
                  {car.sold && (
                    <span className="absolute top-2 left-2 text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full">Sold</span>
                  )}
                  {!car.sold && car.unavailable && (
                    <span className="absolute top-2 left-2 text-[10px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/cars/${car._id}`} className="font-black text-slate-900 text-sm hover:text-[#3083ff]">
                  {car.title}
                </Link>
                <p className="text-sm font-black text-[#3083ff] mt-1">{formatINR(car.price)}</p>
                {car.priceDrop > 0 && (
                  <p className="text-[11px] font-black text-emerald-600 mt-1">Price dropped {formatINR(car.priceDrop)}</p>
                )}
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  {[car.year, car.fuel, car.transmission, car.kmDriven != null ? `${Number(car.kmDriven).toLocaleString('en-IN')} km` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => contact(car)}
                    className="flex-1 text-[11px] font-black uppercase tracking-wider bg-[#3083ff] text-white rounded-xl py-2"
                  >
                    Contact seller
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const result = addCompare(car);
                      if (result.full) toast.error('Compare tray is full (4 cars)');
                      else toast.success(result.already ? 'Already in compare' : 'Added to compare');
                    }}
                    className="text-[11px] font-black uppercase tracking-wider border border-white/40 rounded-xl px-3"
                  >
                    VS
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(car)}
                    className="flex-1 text-[11px] font-black uppercase tracking-wider border border-slate-200 rounded-xl py-2"
                  >
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
