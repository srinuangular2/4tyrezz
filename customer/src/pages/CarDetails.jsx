import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import CarCard from '../components/CarCard';
import { formatPrice, formatKm } from '../utils/format';

export default function CarDetails() {
  const { id } = useParams();
  const { user } = useSelector((s) => s.auth);
  const [car, setCar] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setActiveImg(0);
    setCar(null);
    api.get(`/cars/${id}`).then((r) => setCar(r.data)).catch(() => setCar('error'));
    api.get(`/cars/${id}/similar`).then((r) => setSimilar(r.data)).catch(() => setSimilar([]));
  }, [id]);

  const submitContact = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await api.post('/leads', {
      carId: id,
      name: form.get('name'),
      phone: form.get('phone'),
      message: form.get('message'),
    });
    setSent(true);
  };

  if (!car) return <div className="container-px py-16"><CarSkeleton /></div>;
  if (car === 'error') return <div className="container-px py-16 text-center text-slate2">This listing couldn't be loaded. It may have been removed.</div>;

  return (
    <div className="container-px py-8">
      <p className="text-sm text-slate2 mb-4">
        <Link to="/cars" className="hover:text-ember">Used cars</Link> / {car.brand?.name} / {car.title}
      </p>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
        <div>
          <div className="rounded-2xl overflow-hidden border border-slate-100 h-[420px] bg-slate-100 flex items-center justify-center">
            {car.images?.length ? (
              <img src={car.images[activeImg]} alt={car.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 text-sm">No photos yet</span>
            )}
          </div>
          {car.images?.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {car.images.map((img, i) => (
                <img key={i} src={img} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${i === activeImg ? 'border-ember' : 'border-transparent opacity-60'}`} />
              ))}
            </div>
          )}

          <section className="mt-8">
            <h3 className="font-display font-extrabold text-xl mb-3">Specifications</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Brand', car.brand?.name], ['Model', car.model?.name], ['Variant', car.variant],
                  ['Year', car.year], ['Fuel type', car.fuel], ['KM driven', formatKm(car.kmDriven)],
                  ['Transmission', car.transmission], ['Body type', car.bodyType],
                  ['Ownership', `${car.ownership}${car.ownership === 1 ? 'st' : car.ownership === 2 ? 'nd' : 'rd'} owner`],
                  ['Color', car.color], ['Location', car.city?.name],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-100">
                    <td className="py-2.5 text-slate2 w-1/2">{k}</td>
                    <td className="py-2.5 font-semibold">{v || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {car.features?.length > 0 && (
            <section className="mt-8">
              <h3 className="font-display font-extrabold text-xl mb-3">Features</h3>
              <div className="flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <span key={f} className="bg-verify-bg text-verify text-xs font-semibold px-3 py-1.5 rounded-full">✓ {f}</span>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h3 className="font-display font-extrabold text-xl mb-3">Description</h3>
            <p className="text-sm text-slate2">{car.description || 'No description provided.'}</p>
          </section>

          <section className="mt-8">
            <h3 className="font-display font-extrabold text-xl mb-3">Seller details</h3>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-sm">
              <p className="font-semibold">{car.owner?.dealershipName || car.owner?.name || 'Private seller'}</p>
              <p className="text-slate2 mt-1">{car.sellerType === 'dealer' ? 'Verified Dealer' : 'Individual owner'} · {car.city?.name}</p>
            </div>
          </section>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 lg:sticky lg:top-24">
          <h1 className="font-semibold text-xl">{car.title}</h1>
          <p className="font-display font-extrabold text-ember text-3xl mt-2">{formatPrice(car.price)}</p>
          <span className="inline-block bg-verify-bg text-verify text-xs font-bold px-2.5 py-1 rounded-md mt-2 capitalize">{car.status}</span>

          {car.inspectionScore && (
            <div className="flex items-center gap-3 bg-verify-bg rounded-xl p-4 mt-4">
              <div className="w-12 h-12 rounded-full bg-verify text-white flex items-center justify-center font-display font-extrabold flex-shrink-0">
                {car.inspectionScore}
              </div>
              <div>
                <p className="text-verify text-sm font-bold">Verified — {car.inspectionScore}/100 inspection score</p>
                <p className="text-xs text-slate2">15-point manual check by a 4tyrezz inspector</p>
              </div>
            </div>
          )}

          <button onClick={() => setShowContact(true)} className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-3 rounded-lg mt-5">
            Contact seller
          </button>
          <button className="w-full border-2 border-ink text-ink font-semibold py-3 rounded-lg mt-2.5 hover:bg-ink hover:text-white transition">
            Book a physical inspection
          </button>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h3 className="font-display font-extrabold text-2xl mb-5">Similar cars</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similar.map((c) => <CarCard key={c._id} car={c} />)}
          </div>
        </section>
      )}

      {showContact && (
        <div className="fixed inset-0 z-[100] bg-ink/50 flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <>
                <h3 className="font-display font-extrabold text-xl">Message sent!</h3>
                <p className="text-sm text-slate2 mt-2">The seller will reach out to you shortly.</p>
                <button onClick={() => setShowContact(false)} className="w-full bg-ink text-white font-semibold py-2.5 rounded-lg mt-4">Close</button>
              </>
            ) : (
              <form onSubmit={submitContact} className="space-y-3">
                <h3 className="font-display font-extrabold text-xl mb-1">Contact seller</h3>
                <input name="name" required placeholder="Your name" defaultValue={user?.name} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                <input name="phone" required placeholder="Your phone" defaultValue={user?.mobile} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                <textarea name="message" rows="3" placeholder="I'm interested in this car..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
                <button className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-2.5 rounded-lg">Send message</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CarSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
      <div className="h-[420px] skeleton rounded-2xl" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}
