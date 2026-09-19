import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, FileText, Gauge, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import api from '../../api/axios';
import { useVehicleBrands } from '../../hooks/useVehicleCatalog';
import { fetchVehicleDetailsByReg, formatPlateInput, normalizeReg } from '../../lib/fetchVehicleDetailsByReg';
import LocationAddressInput from './LocationAddressInput';
import AiDescriptionField from './AiDescriptionField';
import BrandModelGrid from '../sell/BrandModelGrid';
import VehicleColorFields from './VehicleColorFields';

const STEPS = [
  { n: 1, title: 'Vehicle Identity', hint: 'RC & catalogue' },
  { n: 2, title: 'Specs & Pricing', hint: 'KM & resale' },
  { n: 3, title: 'Health & Features', hint: 'Condition' },
  { n: 4, title: 'Media & Documents', hint: '360° photos' },
];

const FEATURES = [
  ['Leather Seats', '🛋️'],
  ['Sunroof', '☀️'],
  ['Apple CarPlay', '📱'],
  ['6 Airbags', '🛡️'],
  ['360 Camera', '📷'],
  ['Alloy Wheels', '⚙️'],
  ['ABS', '🛑'],
  ['Touchscreen', '🖥️'],
];

const HEALTH = [
  { label: 'Showroom Condition', score: 10 },
  { label: 'Excellent', score: 9 },
  { label: 'Good', score: 7 },
  { label: 'Needs Minor Work', score: 5 },
];

const PHOTO_SLOTS = [
  { key: 'front', label: 'Front Exterior' },
  { key: 'rear', label: 'Rear Exterior' },
  { key: 'dashboard', label: 'Dashboard / Console' },
  { key: 'odometer', label: 'Odometer Reading' },
  { key: 'tyres', label: 'Tyres / Wheels' },
];

const DOCS = [
  { key: 'rcCopy', label: 'RC copy' },
  { key: 'insurancePolicy', label: 'Insurance policy' },
  { key: 'serviceHistory', label: 'Service history log' },
];

const input =
  'w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm font-medium outline-none text-slate-900 dark:text-slate-100';
const labelCls = 'block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-1.5';
const ghostBtn = 'border border-slate-200 dark:border-slate-700 font-semibold rounded-xl px-6 py-3.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
const primaryBtn =
  'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50';

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name || '';
}

function normalizeFuel(v) {
  const s = String(v || '').toLowerCase();
  if (s.includes('diesel')) return 'Diesel';
  if (s.includes('electric') || s === 'ev') return 'Electric';
  if (s.includes('hybrid')) return 'Hybrid';
  if (s.includes('cng')) return 'CNG';
  return 'Petrol';
}

function normalizeTrans(v) {
  const s = String(v || '').toLowerCase();
  if (s.includes('auto') || s.includes('amt') || s.includes('cvt') || s.includes('dct') || s.includes('ivt')) return 'Automatic';
  return 'Manual';
}

function normalizeBody(v) {
  const s = String(v || '').toLowerCase();
  if (s.includes('suv')) return 'SUV';
  if (s.includes('sedan')) return 'Sedan';
  if (s.includes('muv') || s.includes('mpv')) return 'MUV';
  if (s.includes('lux')) return 'Luxury';
  if (s.includes('convert')) return 'Convertible';
  return 'Hatchback';
}

function formatLakh(n) {
  const v = Number(n);
  if (!v) return '';
  if (v >= 10000000) return `₹ ${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹ ${(v / 100000).toFixed(2)} Lakh`;
  return `₹ ${v.toLocaleString('en-IN')}`;
}

function formatINR(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function ownerLabel(n) {
  if (Number(n) === 1) return '1st Owner';
  if (Number(n) === 2) return '2nd Owner';
  if (Number(n) === 3) return '3rd Owner';
  return `${n} Owners`;
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition border ${
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function AddCarWizard({
  afterSave,
  editId,
  extraFields,
  variant = 'dealer',
  dealers = [],
  ownerId = '',
  onOwnerChange,
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [verified, setVerified] = useState(false);
  const [editManual, setEditManual] = useState(false);
  const [manualPhase, setManualPhase] = useState('brand');
  const [valuation, setValuation] = useState(null);
  const [features, setFeatures] = useState([]);
  const [slots, setSlots] = useState({});
  const [extras, setExtras] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [docs, setDocs] = useState({});
  const [form, setForm] = useState({
    plate: '',
    brand: '',
    model: '',
    year: '',
    variant: '',
    fuel: '',
    transmission: '',
    bodyType: '',
    kmDriven: '',
    ownership: 1,
    color: '',
    city: '',
    rto: '',
    price: '',
    title: '',
    description: '',
    engineState: 'Excellent',
    serviceHistory: 'Full dealer',
    tyreCondition: 70,
    keyCount: 2,
    accidental: 'No',
    floodDamage: 'No',
    conditionScore: 9,
    interiorColor: '',
    videoUrl: '',
    pickupLocation: '',
    locationState: '',
    locationCity: '',
    locationArea: '',
    pincode: '',
    formattedAddress: '',
    lat: '',
    lng: '',
    insuranceType: 'Comprehensive',
    insuranceExpiry: '',
    pucExpiry: '',
    accidentDetails: '',
    serviceHistoryLog: '',
    rtoLookup: null,
  });

  const { brands } = useVehicleBrands();

  const brandNames = useMemo(() => (brands || []).map(nameOf).filter(Boolean), [brands]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const patchIdentity = useCallback((partial) => {
    if (partial.manualPhase) setManualPhase(partial.manualPhase);
    setForm((f) => {
      const next = { ...f };
      Object.entries(partial).forEach(([k, v]) => {
        if (k === 'manualPhase' || k === 'brandId' || k === 'modelId' || k === 'brandLogo') return;
        next[k] = v;
      });
      return next;
    });
  }, []);

  const openManualPicker = () => {
    setEditManual(true);
    setManualPhase(form.model ? 'variant' : form.year ? 'model' : form.brand ? 'year' : 'brand');
  };

  useEffect(() => {
    if (!editId) return;
    api.get(`/cars/${editId}`).then((r) => {
      const c = r.data;
      const cl = c.inspectionChecklist || {};
      setForm((f) => ({
        ...f,
        brand: c.brand?.name || '',
        model: c.model?.name || '',
        year: c.year || '',
        variant: c.variant || '',
        fuel: c.fuel || '',
        transmission: c.transmission || '',
        bodyType: c.bodyType || '',
        kmDriven: c.kmDriven || '',
        ownership: c.ownership || 1,
        color: c.color || '',
        city: c.city?.name || '',
        rto: c.rto || c.rtoDetails?.rtoLocation || '',
        price: c.price || '',
        title: c.title || '',
        description: c.description || '',
        engineState: cl.engineState || 'Excellent',
        serviceHistory: cl.serviceHistory || 'Full dealer',
        tyreCondition: cl.tyreCondition || 70,
        keyCount: cl.keyCount || 2,
        accidental: cl.accidental || 'No',
        floodDamage: cl.floodDamage || 'No',
        plate: c.rtoDetails?.rcNumber || '',
        conditionScore: c.quickInsights?.condition?.conditionScore || 7,
        interiorColor: c.interiorColor || '',
        videoUrl: c.videoUrl || '',
        pickupLocation: c.pickupLocation || c.location?.formattedAddress || '',
        locationState: c.location?.state || c.city?.state || '',
        locationCity: c.location?.city || c.city?.name || '',
        locationArea: c.location?.area || '',
        pincode: c.location?.pincode || '',
        formattedAddress: c.location?.formattedAddress || '',
        lat: c.location?.coordinates?.coordinates?.[1] || '',
        lng: c.location?.coordinates?.coordinates?.[0] || '',
        insuranceType: c.insuranceType || 'Comprehensive',
        insuranceExpiry: c.insuranceExpiry || c.rtoDetails?.insuranceExpiryDate || '',
        pucExpiry: c.pucExpiry || c.rtoDetails?.puccValidUpto || '',
        accidentDetails: c.accidentDetails || '',
        serviceHistoryLog: c.serviceHistoryLog || '',
        rtoLookup: c.rtoDetails || null,
      }));
      setFeatures(c.features || []);
      const blocked = new Set(Object.values(c.listingDocuments || {}).filter(Boolean));
      if (c.inspectionReport) blocked.add(c.inspectionReport);
      setExistingImages((c.photos || c.images || []).filter((src) => src && !blocked.has(src) && !/\.pdf($|\?)/i.test(src)));
      const filled = {};
      PHOTO_SLOTS.forEach(({ key }) => {
        if (c.mediaSlots?.[key]) filled[key] = { preview: c.mediaSlots[key], existing: c.mediaSlots[key] };
      });
      setSlots(filled);
      if (c.brand?.name) {
        setVerified(true);
        setEditManual(false);
      }
    });
  }, [editId]);

  const lookup = async () => {
    const reg = normalizeReg(form.plate);
    if (reg.length < 8) {
      toast.error('Enter a full registration number, e.g. TS 09 AB 1234');
      return;
    }
    setLookingUp(true);
    try {
      const details = await fetchVehicleDetailsByReg(form.plate);
      const brand = brandNames.find((n) => n.toLowerCase() === String(details.brand || '').toLowerCase())
        || brandNames.find((n) => String(details.brand || '').toLowerCase().includes(n.toLowerCase()))
        || details.brand || '';
      setForm((f) => ({
        ...f,
        brand,
        model: details.model || f.model,
        year: details.year || details.registrationYear || f.year,
        variant: details.variant || f.variant,
        fuel: details.fuel || details.fuelType || f.fuel,
        transmission: details.transmission || f.transmission,
        bodyType: details.bodyType || f.bodyType,
        city: details.city || f.city,
        rto: details.rto || details.rtoName || details.rtoLocation || f.rto,
        ownership: Number(details.ownership || details.ownerCount || f.ownership) || 1,
        color: details.color || f.color,
        insuranceExpiry: details.insuranceUpto || details.insuranceExpiryDate || f.insuranceExpiry,
        pucExpiry: details.puccValidUpto || f.pucExpiry,
        rtoLookup: details,
      }));
      setVerified(true);
      setEditManual(false);
      toast.success('RC details verified');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lookup failed — enter specs manually');
      setEditManual(true);
    } finally {
      setLookingUp(false);
    }
  };

  const quote = async () => {
    if (!form.brand || !form.model || !form.year) return;
    try {
      const { data } = await api.post('/valuation/calculate', {
        brand: form.brand,
        model: form.model,
        variant: form.variant,
        year: Number(form.year),
        kmDriven: Number(form.kmDriven) || 45000,
        ownership: Number(form.ownership) || 1,
        fuel: form.fuel,
        transmission: form.transmission,
        bodyType: form.bodyType,
        conditionScore: Number(form.conditionScore) || 7,
      });
      const v = data.valuation || data.data?.valuation;
      setValuation(v);
      if (!form.price && v?.fairMarketValue) set('price', v.fairMarketValue);
    } catch {
      setValuation(null);
    }
  };

  useEffect(() => {
    if (step === 2 && form.brand && form.model && form.year) quote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.brand, form.model, form.year, form.variant, form.kmDriven, form.conditionScore]);

  const go = (next) => {
    if (next > 1 && (!form.brand || !form.model || !form.year)) {
      toast.error('Select brand, model and year first');
      return;
    }
    if (next > 2 && !form.price) {
      toast.error('Enter an expected selling price');
      return;
    }
    setStep(next);
  };

  const assignSlot = (key, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setSlots((s) => ({ ...s, [key]: { file, preview } }));
  };

  const submit = async () => {
    if (!form.brand || !form.model || !form.year || !form.price) {
      toast.error('Brand, model, year and price are required');
      return;
    }
    setSaving(true);
    const data = new FormData();
    const title = form.title || `${form.year} ${form.brand} ${form.model}`.trim();
    data.append('title', title);
    data.append('brand', form.brand);
    data.append('model', form.model);
    data.append('brandName', form.brand);
    data.append('modelName', form.model);
    data.append('cityName', form.locationCity || form.city || form.rto);
    data.append('pickupLocation', form.formattedAddress || form.pickupLocation);
    data.append('locationState', form.locationState);
    data.append('locationCity', form.locationCity || form.city);
    data.append('locationArea', form.locationArea);
    data.append('pincode', form.pincode);
    data.append('formattedAddress', form.formattedAddress || form.pickupLocation);
    data.append('lat', form.lat);
    data.append('lng', form.lng);
    data.append('location', JSON.stringify({
      state: form.locationState,
      city: form.locationCity || form.city,
      area: form.locationArea,
      pincode: form.pincode,
      formattedAddress: form.formattedAddress || form.pickupLocation,
      coordinates: form.lng && form.lat ? { type: 'Point', coordinates: [Number(form.lng), Number(form.lat)] } : undefined,
    }));
    data.append('variant', form.variant || '');
    data.append('year', form.year);
    data.append('price', form.price);
    data.append('fuel', normalizeFuel(form.fuel));
    data.append('transmission', normalizeTrans(form.transmission));
    data.append('bodyType', normalizeBody(form.bodyType));
    data.append('kmDriven', form.kmDriven || 0);
    data.append('ownership', form.ownership);
    data.append('color', form.color);
    data.append('interiorColor', form.interiorColor);
    data.append('videoUrl', form.videoUrl);
    data.append('insuranceType', form.insuranceType || '');
    data.append('insuranceExpiry', form.insuranceExpiry);
    data.append('pucExpiry', form.pucExpiry);
    data.append('accidentDetails', form.accidentDetails);
    data.append('serviceHistoryLog', form.serviceHistoryLog);
    data.append('rto', form.rto);
    data.append('registrationYear', form.rtoLookup?.year || form.year || '');
    data.append('description', form.description);
    data.append('conditionScore', form.conditionScore);
    data.append('features', JSON.stringify(features));
    const lookup = form.rtoLookup || {};
    data.append('rtoDetails', JSON.stringify({
      rcNumber: form.plate || lookup.rcNumber || lookup.registrationNumber || '',
      rtoLocation: form.rto || lookup.rto || lookup.rtoLocation || '',
      rcStatus: lookup.rcStatus || '',
      registrationDate: lookup.registrationDate || '',
      registrationYear: lookup.year || form.year || '',
      insuranceExpiryDate: form.insuranceExpiry || lookup.insuranceUpto || lookup.insuranceExpiryDate || '',
      insuranceCompany: lookup.insuranceCompany || '',
      engineCapacityCC: lookup.engineCapacityCC || null,
      puccValidUpto: form.pucExpiry || lookup.puccValidUpto || '',
      fitnessValidUpto: lookup.fitnessValidUpto || '',
      color: form.color || lookup.color || '',
      fuel: form.fuel || lookup.fuel || '',
      bodyType: form.bodyType || lookup.bodyType || '',
    }));
    data.append('inspectionChecklist', JSON.stringify({
      engineState: form.engineState,
      serviceHistory: form.serviceHistory,
      tyreCondition: Number(form.tyreCondition),
      keyCount: Number(form.keyCount),
      accidental: form.accidental,
      floodDamage: form.floodDamage,
    }));
    if (valuation) {
      data.append('quickInsights', JSON.stringify({
        marketPriceMin: valuation.estimatedMinPrice,
        marketPriceMax: valuation.estimatedMaxPrice,
        condition: { accidental: form.accidental, conditionScore: form.conditionScore },
      }));
    }

    const slotOrder = [];
    PHOTO_SLOTS.forEach(({ key }) => {
      const item = slots[key];
      if (item?.file) {
        data.append('images', item.file);
        slotOrder.push(key);
      }
    });
    extras.forEach((file) => {
      data.append('images', file);
      slotOrder.push('extra');
    });
    data.append('imageSlots', JSON.stringify(slotOrder));

    const existingSlots = {};
    PHOTO_SLOTS.forEach(({ key }) => {
      if (slots[key]?.existing && !slots[key]?.file) existingSlots[key] = slots[key].existing;
    });
    data.append('mediaSlots', JSON.stringify(existingSlots));
    data.append('existingImages', JSON.stringify(existingImages));

    const documentSlots = [];
    DOCS.forEach(({ key }) => {
      if (docs[key]) {
        data.append('images', docs[key]);
        documentSlots.push(key);
      }
    });
    data.append('documentSlots', JSON.stringify(documentSlots));

    Object.entries(extraFields || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') data.append(key, value);
    });
    if (variant === 'admin' && ownerId) data.append('owner', ownerId);

    try {
      if (editId) await api.put(`/cars/${editId}`, data);
      else await api.post('/cars', data);
      toast.success(editId ? 'Listing updated' : 'Listing submitted');
      afterSave?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save listing');
    } finally {
      setSaving(false);
    }
  };

  const showCascade = editManual;

  return (
    <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Spinny-style listing</p>
          <h1 className="font-display font-black text-2xl text-slate-900 dark:text-white mt-1">
            {editId ? 'Edit listing' : 'Add a car'}
          </h1>
        </div>
        {variant === 'admin' && !editId && (
          <label className="min-w-[240px]">
            <span className={labelCls}>Listed by</span>
            <select className={input} value={ownerId} onChange={(e) => onOwnerChange?.(e.target.value)}>
              <option value="">Platform certified</option>
              {dealers.map((d) => (
                <option key={d._id} value={d._id}>{d.dealershipName || d.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 min-w-0">
            <button type="button" onClick={() => setStep(s.n)} className="text-left shrink-0">
              <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold border transition ${
                step === s.n
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-500/20'
                  : step > s.n
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{step > s.n ? <Check className="w-3 h-3" /> : s.n}</span>
                {s.title}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className={`hidden sm:block h-0.5 w-8 rounded-full ${step > s.n ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="transition-all duration-300">
        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-950 text-white p-5 sm:p-6 shadow-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">RTO plate lookup</p>
              <h2 className="font-display font-black text-xl mt-1">Enter vehicle registration number</h2>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  className="flex-1 bg-white text-slate-900 font-black tracking-[0.18em] text-center sm:text-left uppercase rounded-xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-400/40"
                  value={form.plate}
                  placeholder="e.g. TS 09 AB 1234"
                  onChange={(e) => set('plate', formatPlateInput(e.target.value))}
                />
                <button type="button" disabled={lookingUp} onClick={lookup} className={primaryBtn}>
                  {lookingUp ? 'Fetching…' : '⚡ Fetch Car Details'}
                </button>
              </div>
            </div>

            {verified && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Verified vehicle details</p>
                    <p className="font-display font-black text-xl text-slate-900 dark:text-white mt-1">
                      {[form.year, form.brand, form.model, form.variant].filter(Boolean).join(' ')}
                    </p>
                  </div>
                  <button type="button" onClick={openManualPicker} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                    {editManual ? 'Hide manual edit' : 'Edit manually'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified RTO
                  </span>
                  <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600">{ownerLabel(form.ownership)}</span>
                  {(form.rto || form.city) && (
                    <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {form.plate?.slice(0, 5) || 'TS-09'} {form.rto || form.city}
                    </span>
                  )}
                  {form.fuel && <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600">{form.fuel}</span>}
                  {form.transmission && <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600">{form.transmission}</span>}
                </div>
              </div>
            )}

            {showCascade && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Or pick from catalogue</p>
                  {editManual && (
                    <button type="button" onClick={() => setEditManual(false)} className="text-xs font-bold text-slate-400 hover:text-slate-700">
                      Hide
                    </button>
                  )}
                </div>
                <BrandModelGrid
                  state={{ ...form, manualPhase }}
                  patch={patchIdentity}
                  onReady={() => go(2)}
                  onClose={() => setEditManual(false)}
                />
              </div>
            )}

            {!editManual && (
              <button
                type="button"
                onClick={openManualPicker}
                className="text-sm font-extrabold text-blue-600 hover:underline"
              >
                Or search manually by brand
              </button>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={() => go(2)} className={primaryBtn}>Continue to specs</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 shadow-lg shadow-blue-500/20">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-100 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Live resale range
              </p>
              {valuation ? (
                <>
                  <p className="font-display font-black text-2xl mt-2">
                    {formatINR(valuation.estimatedMinPrice)} – {formatINR(valuation.estimatedMaxPrice)}
                  </p>
                  <p className="text-sm text-blue-100 mt-1">Fair market value {formatINR(valuation.fairMarketValue)}</p>
                </>
              ) : (
                <p className="text-sm text-blue-100 mt-2">Add brand, model and year to load a market band.</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <span className={labelCls}>Kilometers driven</span>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <input
                    className={input}
                    value={form.kmDriven === '' || form.kmDriven == null ? '' : Number(form.kmDriven).toLocaleString('en-IN')}
                    onChange={(e) => set('kmDriven', e.target.value.replace(/\D/g, ''))}
                    placeholder="45,000"
                    inputMode="numeric"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[10000, 25000, 50000].map((n) => {
                    const active = Number(form.kmDriven) === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => set('kmDriven', String(n))}
                        className={`text-xs font-bold rounded-full border px-3 py-1.5 ${
                          active
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600'
                        }`}
                      >
                        {n.toLocaleString('en-IN')}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <span className={labelCls}>Expected selling price</span>
                <input className={input} value={form.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))} placeholder="750000" />
                <p className="mt-2 text-sm font-black text-blue-600">{formatLakh(form.price) || '₹ 0'}</p>
              </div>
              <label className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <span className={labelCls}>Ownership</span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <Pill key={n} active={Number(form.ownership) === n} onClick={() => set('ownership', n)}>{ownerLabel(n)}</Pill>
                  ))}
                </div>
              </label>
              <VehicleColorFields form={form} set={set} input={input} labelCls={labelCls} />
              <label className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <span className={labelCls}>Registration / RTO</span>
                <input className={input} value={form.rto} onChange={(e) => set('rto', e.target.value)} placeholder="Hyderabad / TS09" />
              </label>
              <label className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <span className={labelCls}>Showroom / listing location</span>
                <LocationAddressInput
                  value={form.formattedAddress || form.pickupLocation}
                  city={form.locationCity || form.city}
                  placeholder="Gachibowli, Hyderabad"
                  onChange={(v) => {
                    set('pickupLocation', v);
                    set('formattedAddress', v);
                  }}
                  onSelect={(place) => setForm((f) => ({
                    ...f,
                    locationState: place.state,
                    locationCity: place.city,
                    locationArea: place.area,
                    pincode: place.pincode,
                    formattedAddress: place.formattedAddress,
                    pickupLocation: place.pickupLocation,
                    city: place.city || f.city,
                    lat: place.lat,
                    lng: place.lng,
                  }))}
                />
                {(form.locationArea || form.locationCity) && (
                  <p className="mt-2 text-[11px] font-bold text-slate-500">
                    {[form.locationArea, form.locationCity, form.locationState, form.pincode].filter(Boolean).join(' · ')}
                  </p>
                )}
              </label>
            </div>

            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className={ghostBtn}>Back</button>
              <button type="button" onClick={() => go(3)} className={primaryBtn}>Continue to health</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className={labelCls}>Key features</p>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map(([name, icon]) => (
                  <Pill
                    key={name}
                    active={features.includes(name)}
                    onClick={() => setFeatures((list) => list.includes(name) ? list.filter((x) => x !== name) : [...list, name])}
                  >
                    {icon} {name}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <p className={labelCls}>Vehicle health state</p>
              <div className="flex flex-wrap gap-2">
                {HEALTH.map((h) => (
                  <Pill
                    key={h.label}
                    active={form.engineState === h.label}
                    onClick={() => setForm((f) => ({ ...f, engineState: h.label, conditionScore: h.score }))}
                  >
                    {h.label}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <p className={labelCls}>Number of keys</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2].map((n) => (
                  <Pill key={n} active={Number(form.keyCount) === n} onClick={() => set('keyCount', n)}>
                    {n} {n === 1 ? 'Key' : 'Keys'}
                  </Pill>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className={labelCls}>Accidents</p>
                <div className="flex gap-2">
                  {['No', 'Yes'].map((v) => (
                    <Pill key={v} active={form.accidental === v} onClick={() => set('accidental', v)}>{v === 'No' ? 'No accidents' : 'Accidental'}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <p className={labelCls}>Flood damage</p>
                <div className="flex gap-2">
                  {['No', 'Yes'].map((v) => (
                    <Pill key={v} active={form.floodDamage === v} onClick={() => set('floodDamage', v)}>{v === 'No' ? 'Clean' : 'Flooded'}</Pill>
                  ))}
                </div>
              </div>
            </div>
            {form.accidental === 'Yes' && (
              <label className="block">
                <span className={labelCls}>Accident details</span>
                <textarea className={input} rows={2} value={form.accidentDetails} onChange={(e) => set('accidentDetails', e.target.value)} />
              </label>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <label>
                <span className={labelCls}>Insurance type</span>
                <select className={input} value={form.insuranceType} onChange={(e) => set('insuranceType', e.target.value)}>
                  <option value="Comprehensive">Comprehensive</option>
                  <option value="Third Party">Third Party</option>
                </select>
              </label>
              <label>
                <span className={labelCls}>Insurance expiry</span>
                <input type="date" className={input} value={form.insuranceExpiry} onChange={(e) => set('insuranceExpiry', e.target.value)} />
              </label>
              <label>
                <span className={labelCls}>PUC expiry</span>
                <input type="date" className={input} value={form.pucExpiry} onChange={(e) => set('pucExpiry', e.target.value)} />
              </label>
              <label>
                <span className={labelCls}>Service history log</span>
                <input className={input} value={form.serviceHistoryLog} onChange={(e) => set('serviceHistoryLog', e.target.value)} placeholder="Last service date / notes" />
              </label>
            </div>
            <label className="block">
              <span className={labelCls}>Tyre condition {form.tyreCondition}%</span>
              <input type="range" min={10} max={100} value={form.tyreCondition} onChange={(e) => set('tyreCondition', Number(e.target.value))} className="w-full accent-blue-600" />
            </label>
            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => setStep(2)} className={ghostBtn}>Back</button>
              <button type="button" onClick={() => go(4)} className={primaryBtn}>Continue to media</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <label className="block">
              <span className={labelCls}>Video URL (YouTube / MP4)</span>
              <input className={input} value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://" />
            </label>
            <div>
              <p className={labelCls}>360° photo slots</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PHOTO_SLOTS.map(({ key, label }) => {
                  const item = slots[key];
                  return (
                    <label key={key} className="relative rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[140px] flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 bg-slate-50 dark:bg-slate-800/40">
                      {item?.preview ? (
                        <>
                          <img src={item.preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setSlots((s) => ({ ...s, [key]: undefined })); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-700 flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-blue-600" />
                          <span className="mt-2 text-xs font-bold text-slate-600">{label}</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => assignSlot(key, e.target.files?.[0])} />
                    </label>
                  );
                })}
              </div>
            </div>

            {existingImages.length > 0 && (
              <div>
                <p className={labelCls}>Existing photos</p>
                <p className="text-[11px] text-slate-500 mb-2">Car photos only. Remove any RC or insurance scans — those stay under Documents.</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((src) => (
                    <div key={src} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setExistingImages((list) => list.filter((x) => x !== src))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white text-slate-700 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const pics = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
                if (pics.length) setExtras((prev) => [...prev, ...pics]);
              }}
              className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 text-center"
            >
              <p className="text-sm font-semibold text-slate-500">Drop extra 360° photos here</p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="mt-3 block mx-auto text-xs"
                onChange={(e) => setExtras((prev) => [...prev, ...Array.from(e.target.files || [])])}
              />
              {extras.length > 0 && <p className="text-xs font-bold text-slate-400 mt-2">{extras.length} extra photo{extras.length > 1 ? 's' : ''}</p>}
            </div>

            <div>
              <p className={labelCls}>Documents</p>
              <p className="text-[11px] text-slate-500 mb-2">Private to 4tyrezz staff — never shown in the public car gallery.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {DOCS.map(({ key, label }) => (
                  <label key={key} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:border-blue-400">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{docs[key]?.name || 'PDF / image'}</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(e) => setDocs((d) => ({ ...d, [key]: e.target.files?.[0] }))}
                    />
                  </label>
                ))}
              </div>
            </div>

            <AiDescriptionField
              form={form}
              features={features}
              value={form.description}
              onChange={(text) => set('description', text)}
            />

            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => setStep(3)} className={ghostBtn}>Back</button>
              <button type="button" disabled={saving} onClick={submit} className={primaryBtn}>
                {saving ? 'Publishing…' : editId ? 'Update listing' : 'Publish listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
