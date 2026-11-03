import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthGuard } from '../components/AuthGuardModal';
import useReferenceData from '../hooks/useReferenceData';
import { useVehicleBrands, useVehicleModels } from '../hooks/useVehicleCatalog';
import CatalogSearchList from '../components/pdi/CatalogSearchList';
import { PRIMARY_CITIES, inr, quoteSegment } from '../lib/pdiPricing';

const SLOTS = ['09:00–11:00', '11:00–13:00', '14:00–16:00', '16:00–18:00'];

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name || '';
}

function segmentFromQuery(value) {
  return value === 'suv' || value === 'SUV_LUXURY' ? 'SUV_LUXURY' : 'HATCH_SEDAN';
}

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Payment window could not be opened'));
    document.body.appendChild(script);
  });
}

export default function InspectionBook() {
  const [params, setParams] = useSearchParams();
  const { requireAuth } = useAuthGuard();
  const user = useSelector((state) => state.auth.user);
  const type = params.get('type') === 'new' ? 'NEW_CAR' : 'USED_CAR';
  const { brands, loading: loadingBrands } = useVehicleBrands();
  const { cities } = useReferenceData();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    brand: params.get('brand') || '',
    model: params.get('model') || '',
    scheduledDate: '',
    timeSlot: SLOTS[0],
    city: params.get('city') || 'Hyderabad',
    address: '',
    vehicleSegment: segmentFromQuery(params.get('segment')),
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.name || '',
      phone: current.phone || String(user.mobile || user.phone || '').replace(/\D/g, '').slice(-10),
      email: current.email || user.email || '',
    }));
  }, [user]);
  const { models, loading: loadingModels } = useVehicleModels(form.brand);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const brandRows = useMemo(
    () => brands.map((item) => (typeof item === 'string' ? { name: item, logo: '' } : { name: item?.name || '', logo: item?.logo || '' })).filter((item) => item.name),
    [brands]
  );
  const brandLogo = brandRows.find((item) => item.name === form.brand)?.logo || '';
  const modelRows = useMemo(
    () => models.map(nameOf).filter(Boolean).map((name) => ({ name, logo: brandLogo, brandName: form.brand })),
    [models, brandLogo, form.brand]
  );
  const cityNames = useMemo(() => {
    const fromApi = (cities || []).map((city) => city.name).filter(Boolean);
    const seeded = form.city ? [form.city] : [];
    return Array.from(new Set([...PRIMARY_CITIES, ...fromApi, ...seeded]));
  }, [cities, form.city]);
  const quote = quoteSegment({ pdiType: type, vehicleSegment: form.vehicleSegment, city: form.city });

  const switchType = (next) => {
    const query = { type: next, segment: form.vehicleSegment === 'SUV_LUXURY' ? 'suv' : 'hatch' };
    if (form.city) query.city = form.city;
    setParams(query);
  };

  const payAndSave = async () => {
    if (!form.brand || !form.model) {
      toast.error('Select a brand and a model');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/pdi/bookings', {
        ...form,
        pdiType: type,
        phone: form.phone,
        engineBand: form.vehicleSegment === 'SUV_LUXURY' ? 'ABOVE_1249' : 'UPTO_1249',
        obdScan: true,
        serviceHistory: type === 'USED_CAR',
      });
      const booking = data.data;
      const payment = data.payment;
      if (!payment) {
        toast.error(data.message || 'Saved, but payment did not start');
        return;
      }
      const confirm = async (payload) => {
        const paid = await api.post(`/pdi/bookings/${booking._id}/confirm`, payload);
        setDone(paid.data.data);
        toast.success('Inspection booked');
      };
      if (payment.stub || !payment.keyId || String(payment.keyId).includes('stub')) {
        await confirm({});
        return;
      }
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        name: '4tyrezz',
        description: `${form.brand} ${form.model} inspection`,
        order_id: payment.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        handler: async (response) => {
          try {
            await confirm(response);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment received, confirmation failed');
          }
        },
      });
      checkout.on('payment.failed', () => toast.error('Payment was not completed. Your inspection is saved as pending.'));
      checkout.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit the inspection');
    } finally {
      setSaving(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    requireAuth(payAndSave);
  };

  if (done) {
    return (
      <div className="bg-slate-50 min-h-[60vh] px-4 py-16">
        <div className="max-w-lg mx-auto rounded-3xl bg-white border border-slate-200 p-8 text-center">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Request received</p>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Payment received. Your inspection is booked</h1>
          <p className="text-sm text-slate-500 mt-3">{done.brand} {done.model} · {done.city} · {inr(done.amount)}</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/profile/pdi" className="inline-flex rounded-xl bg-[#3083ff] text-white text-xs font-black uppercase tracking-wider px-5 py-3">
              Track this inspection
            </Link>
            <Link to="/inspection" className="inline-flex rounded-xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider px-5 py-3">
              Back to inspection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-[#0c2e68] text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">4tyrezz inspection</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            {type === 'NEW_CAR' ? 'Book pre-delivery inspection for your new car' : 'Book used car inspection for your selected car'}
          </h1>
          <button
            type="button"
            onClick={() => switchType(type === 'NEW_CAR' ? 'used' : 'new')}
            className="mt-3 text-sm font-semibold text-blue-100 underline underline-offset-2"
          >
            {type === 'NEW_CAR' ? 'Looking for a used car inspection? Book that slot.' : 'Looking for a new car PDI? Book that slot.'}
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-3xl mx-auto px-4 -mt-6 pb-16">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-8 space-y-4">
          <label className="block">
            <span className="text-xs font-black text-slate-700">Name *</span>
            <input required className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-700">Phone *</span>
            <input required inputMode="numeric" maxLength={10} className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-700">Email *</span>
            <input required type="email" className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <CatalogSearchList
              label="Car brand *"
              placeholder={loadingBrands ? 'Loading brands…' : 'Search brand'}
              items={brandRows}
              value={form.brand}
              loading={loadingBrands}
              emptyText="No brands match"
              onChange={(brand) => setForm((current) => ({ ...current, brand, model: '' }))}
            />
            <CatalogSearchList
              label="Car model *"
              placeholder={!form.brand ? 'Select a brand first' : loadingModels ? 'Loading models…' : 'Search model'}
              items={modelRows}
              value={form.model}
              loading={Boolean(form.brand) && loadingModels}
              disabled={!form.brand}
              emptyText={form.brand ? 'No models match' : 'Select a brand first'}
              onChange={(model) => set('model', model)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-black text-slate-700">Date *</span>
              <input required type="date" className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-700">Time *</span>
              <select className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.timeSlot} onChange={(e) => set('timeSlot', e.target.value)}>
                {SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-black text-slate-700">City *</span>
            <select required className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.city} onChange={(e) => set('city', e.target.value)}>
              {cityNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-700">Address where the car is available *</span>
            <input required className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </label>

          <fieldset>
            <legend className="text-xs font-black text-slate-700">Vehicle segment *</legend>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {[['HATCH_SEDAN', 'Hatchback / Sedan'], ['SUV_LUXURY', 'SUV / Luxury']].map(([id, label]) => (
                <label key={id} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${form.vehicleSegment === id ? 'border-[#3083ff] bg-blue-50 text-[#1853ff]' : 'border-slate-200 text-slate-700'}`}>
                  <input type="radio" name="vehicleSegment" checked={form.vehicleSegment === id} onChange={() => set('vehicleSegment', id)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between"><span>Inspection</span><span className="font-bold text-slate-900">{inr(quote.base)}</span></div>
            <div className="flex justify-between mt-1"><span>{quote.visit ? 'On-site visit' : 'Visit included'}</span><span className="font-bold text-slate-900">{inr(quote.visit)}</span></div>
            <p className="text-xs text-slate-500 mt-2">Paint gauge, OBD scan and the PDF report are included.</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total</p>
              <p className="text-2xl font-black text-slate-900">{inr(quote.total)}</p>
            </div>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#3083ff] text-white font-black text-sm px-6 py-3 disabled:opacity-50">
              {saving ? 'Please wait…' : `Pay ${inr(quote.total)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
