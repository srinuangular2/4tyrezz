import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsPhone } from '../components/sell/ui';
import api from '../api/axios';
import { useAuthGuard } from '../components/AuthGuardModal';
import useReferenceData from '../hooks/useReferenceData';
import { useVehicleBrands, useVehicleModels } from '../hooks/useVehicleCatalog';
import CatalogSearchList from '../components/pdi/CatalogSearchList';
import InspectionPriceFields from '../components/pdi/InspectionPriceFields';
import { PRIMARY_CITIES, inr, quoteInspection } from '../lib/pdiPricing';

const SLOTS = ['09:00–11:00', '11:00–13:00', '14:00–16:00', '16:00–18:00'];

const BOOK_STEPS = [
  { label: 'Car', title: 'Which car is it?', hint: 'Pick the brand and model. The size and city are already set.' },
  { label: 'Contact', title: 'Your contact details', hint: 'We use this to confirm the visit and send the report.' },
  { label: 'Address', title: 'Where is the car?', hint: 'House, area, city and PIN code, then pick a day and time.' },
  { label: 'Pay', title: 'Confirm and pay', hint: 'Choose the engine size and any add-ons. The total updates as you tick them.' },
];

const fieldClass = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-[14px] font-medium text-slate-900 outline-none focus:border-[#3083ff]';

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name || '';
}

function engineFromQuery(params) {
  const engine = params.get('engine');
  if (engine === 'above') return 'ABOVE_1249';
  if (engine === 'upto') return 'UPTO_1249';
  if (params.get('segment') === 'suv') return 'ABOVE_1249';
  if (params.get('segment') === 'hatch') return 'UPTO_1249';
  return '';
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
    addressLine: '',
    area: '',
    pincode: '',
    engineBand: engineFromQuery(params),
    obdScan: params.get('obd') !== '0',
    serviceHistory: params.get('history') === '1',
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [step, setStep] = useState(1);
  const [carFocus, setCarFocus] = useState(form.model ? 'done' : form.brand ? 'model' : 'brand');
  const [modelMenu, setModelMenu] = useState(0);
  const phone = useIsPhone();
  const navigate = useNavigate();

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
  const quote = quoteInspection({
    pdiType: type,
    engineBand: form.engineBand,
    obdScan: form.obdScan,
    serviceHistory: form.serviceHistory,
  });

  const switchType = (next) => {
    const query = { type: next };
    if (form.city) query.city = form.city;
    if (form.engineBand === 'ABOVE_1249') query.engine = 'above';
    else if (form.engineBand === 'UPTO_1249') query.engine = 'upto';
    if (!form.obdScan) query.obd = '0';
    if (form.serviceHistory) query.history = '1';
    setParams(query);
  };

  const payAndSave = async () => {
    if (!form.brand || !form.model) {
      toast.error('Select a brand and a model');
      return;
    }
    if (!form.engineBand) {
      toast.error('Select the car type');
      return;
    }
    setSaving(true);
    try {
      const address = [form.addressLine, form.area].filter(Boolean).join(', ') || form.address;
      const { data } = await api.post('/pdi/bookings', {
        ...form,
        address,
        pincode: form.pincode,
        pdiType: type,
        phone: form.phone,
        vehicleSegment: '',
        engineBand: form.engineBand,
        obdScan: form.obdScan,
        serviceHistory: type === 'USED_CAR' && form.serviceHistory,
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

  const goNext = () => {
    if (step === 1) {
      if (!form.brand || !form.model) {
        toast.error('Select the brand and the model');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!form.name.trim()) {
        toast.error('Enter your name');
        return;
      }
      if (form.phone.length !== 10) {
        toast.error('Enter a 10-digit mobile number');
        return;
      }
      if (!form.email.includes('@')) {
        toast.error('Enter a valid email');
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!form.addressLine.trim()) {
        toast.error('Enter the house or flat number');
        return;
      }
      if (!form.area.trim()) {
        toast.error('Enter the street or area');
        return;
      }
      if (form.pincode.length !== 6) {
        toast.error('Enter a 6-digit PIN code');
        return;
      }
      if (!form.scheduledDate) {
        toast.error('Choose the inspection date');
        return;
      }
      setStep(4);
    }
  };

  useEffect(() => {
    if (!phone) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phone]);

  const today = new Date().toISOString().slice(0, 10);
  const meta = BOOK_STEPS[step - 1];

  if (phone && !done && typeof document !== 'undefined') {
    return createPortal(
      <form onSubmit={submit} className="fixed inset-0 z-[70] flex flex-col bg-white">
        <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep(step - 1) : navigate('/inspection'))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#3083ff]">Step {step} of 4</p>
              <h1 className="truncate text-[16px] font-semibold text-slate-900">{meta.title}</h1>
            </div>
          </div>
          <p className="mt-2 text-[12px] font-normal leading-snug text-slate-500">{meta.hint}</p>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {BOOK_STEPS.map((item, index) => {
              const n = index + 1;
              const on = n === step;
              const finished = n < step;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={!finished}
                  onClick={() => setStep(n)}
                  className={`rounded-full px-1 py-1 text-[11px] font-semibold ${on ? 'bg-[#3083ff] text-white' : finished ? 'bg-[#eaf2ff] text-[#1853ff]' : 'bg-slate-100 text-slate-400'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <p className="text-[12px] font-normal text-slate-500">
            {type === 'NEW_CAR' ? 'New car PDI' : 'Used car inspection'}
            {' · '}
            {form.city}
          </p>
          <button type="button" onClick={() => switchType(type === 'NEW_CAR' ? 'used' : 'new')} className="mt-1 text-[12px] font-semibold text-[#3083ff]">
            {type === 'NEW_CAR' ? 'Switch to a used car' : 'Switch to a new car'}
          </button>

          {step === 1 && (
            <div className="mt-4 space-y-4">
              {carFocus === 'brand' ? (
                <CatalogSearchList
                  inline
                  label="Brand"
                  placeholder={loadingBrands ? 'Loading brands…' : 'Search brand'}
                  items={brandRows}
                  value={form.brand}
                  loading={loadingBrands}
                  emptyText="No brands match"
                  onChange={(brand) => {
                    setForm((current) => ({ ...current, brand, model: '' }));
                    setCarFocus('model');
                  }}
                />
              ) : (
                <div>
                  <span className="text-[13px] font-medium text-slate-700">Brand</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((current) => ({ ...current, model: '' }));
                      setCarFocus('brand');
                    }}
                    className="mt-1.5 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left"
                  >
                    <span className="truncate text-[14px] font-semibold text-slate-900">{form.brand}</span>
                    <span className="text-[12px] font-semibold text-[#3083ff]">Change</span>
                  </button>
                </div>
              )}
              {carFocus === 'model' && (
                <CatalogSearchList
                  inline
                  label="Model"
                  placeholder={loadingModels ? 'Loading models…' : 'Search model'}
                  items={modelRows}
                  value={form.model}
                  loading={loadingModels}
                  emptyText="No models match"
                  onChange={(model) => {
                    set('model', model);
                    setCarFocus('done');
                  }}
                />
              )}
              {carFocus === 'done' && form.model && (
                <div>
                  <span className="text-[13px] font-medium text-slate-700">Model</span>
                  <button
                    type="button"
                    onClick={() => setCarFocus('model')}
                    className="mt-1.5 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left"
                  >
                    <span className="truncate text-[14px] font-semibold text-slate-900">{form.model}</span>
                    <span className="text-[12px] font-semibold text-[#3083ff]">Change</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">Full name</span>
                <input required className={fieldClass} placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">Mobile number</span>
                <input required inputMode="numeric" maxLength={10} className={fieldClass} placeholder="10-digit mobile" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">Email</span>
                <input required type="email" className={fieldClass} placeholder="name@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">House / flat</span>
                <input required className={fieldClass} placeholder="Flat, house no., building" value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">Street / area</span>
                <input required className={fieldClass} placeholder="Street, area, landmark" value={form.area} onChange={(e) => set('area', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">City</span>
                <select className={fieldClass} value={form.city} onChange={(e) => set('city', e.target.value)}>
                  {cityNames.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">PIN code</span>
                <input required inputMode="numeric" maxLength={6} className={fieldClass} placeholder="6-digit PIN" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-slate-700">Date</span>
                <input required type="date" min={today} className={fieldClass} value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
              </label>
              <div>
                <p className="text-[13px] font-medium text-slate-700">Time</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => set('timeSlot', slot)}
                      className={`rounded-2xl border px-3 py-3 text-[13px] font-semibold ${form.timeSlot === slot ? 'border-[#3083ff] bg-[#eaf2ff] text-[#1853ff]' : 'border-slate-200 text-slate-700'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[#3083ff]/20 bg-[#f4f8ff] px-3.5 py-3">
                <p className="text-[11px] font-medium text-[#3083ff]">Your visit</p>
                <p className="mt-0.5 text-[14px] font-medium text-slate-900">{form.brand} {form.model}</p>
                <p className="mt-0.5 text-[12px] font-normal text-slate-500">{form.name} · {form.phone}</p>
                <p className="mt-0.5 text-[12px] font-normal text-slate-500">{[form.addressLine, form.area, form.city, form.pincode].filter(Boolean).join(', ')}</p>
                <p className="mt-0.5 text-[12px] font-normal text-slate-500">{form.scheduledDate} · {form.timeSlot}</p>
              </div>
              <InspectionPriceFields
                pdiType={type}
                engineBand={form.engineBand}
                obdScan={form.obdScan}
                serviceHistory={form.serviceHistory}
                onChange={set}
              />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {step < 4 ? (
            <button type="button" onClick={goNext} className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white">
              Continue
            </button>
          ) : (
            <button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white disabled:opacity-50">
              {saving ? 'Please wait…' : `Pay ${inr(quote.total)}`}
            </button>
          )}
        </div>
      </form>,
      document.body
    );
  }

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
              onChange={(brand) => {
                setForm((current) => ({ ...current, brand, model: '' }));
                setModelMenu((current) => current + 1);
              }}
            />
            <CatalogSearchList
              label="Car model *"
              placeholder={!form.brand ? 'Select a brand first' : loadingModels ? 'Loading models…' : 'Search model'}
              items={modelRows}
              value={form.model}
              loading={Boolean(form.brand) && loadingModels}
              disabled={!form.brand}
              openToken={modelMenu}
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
            <span className="text-xs font-black text-slate-700">House / flat *</span>
            <input required className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-700">Street / area *</span>
            <input required className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.area} onChange={(e) => set('area', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-700">PIN code *</span>
            <input required inputMode="numeric" maxLength={6} className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </label>

          <InspectionPriceFields
            pdiType={type}
            engineBand={form.engineBand}
            obdScan={form.obdScan}
            serviceHistory={form.serviceHistory}
            onChange={set}
          />

          <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#3083ff] text-white font-black text-sm px-6 py-3 disabled:opacity-50">
            {saving ? 'Please wait…' : `Pay ${inr(quote.total)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
