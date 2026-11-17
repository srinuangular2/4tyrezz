import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BadgeCheck,
  BatteryCharging,
  CalendarCheck,
  CarFront,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  FileCheck2,
  FileText,
  Gauge,
  Paintbrush,
  ScanLine,
  ShieldCheck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthGuard } from '../components/AuthGuardModal';
import useReferenceData from '../hooks/useReferenceData';
import { useVehicleBrands, useVehicleModels } from '../hooks/useVehicleCatalog';
import CatalogSearchList from '../components/pdi/CatalogSearchList';
import InspectionPriceFields from '../components/pdi/InspectionPriceFields';
import { INSPECTION_URLS, PRIMARY_CITIES, inr, quoteInspection } from '../lib/pdiPricing';
import { usePageMeta } from '../lib/pageMeta';
import { useIsPhone } from '../components/sell/ui';
import LeadHero from '../components/mobile/LeadHero';

const ICON_TONES = {
  blue: 'from-[#6cb2ff] to-[#1853ff]',
  orange: 'from-[#ffc14d] to-[#ff7a18]',
  emerald: 'from-[#5ee08a] to-[#0e9f55]',
  violet: 'from-[#c4a1ff] to-[#7c3aed]',
  rose: 'from-[#ff9bb5] to-[#e11d48]',
  cyan: 'from-[#7eebff] to-[#0891b2]',
  amber: 'from-[#ffe08a] to-[#f59e0b]',
  indigo: 'from-[#b7c2ff] to-[#4f46e5]',
};

function SampleReportButton({ className = '', wide = false }) {
  return (
    <a
      href="/inspection_report.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 bg-white font-semibold text-[#1853ff] ${wide ? 'h-12 w-full justify-between rounded-2xl px-3.5 text-[14px] shadow-[0_8px_18px_rgba(7,20,51,0.16)]' : 'h-11 justify-center rounded-full px-5 text-[13px] shadow-[0_8px_20px_rgba(7,20,51,0.2)]'} ${className}`}
    >
      <span className="flex items-center gap-2.5">
        {wide ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f1ff]">
            <FileText className="h-4 w-4" />
          </span>
        ) : (
          <FileText className="h-4 w-4" />
        )}
        View sample report
      </span>
      {wide ? <ChevronRight className="h-4 w-4 text-[#3083ff]" /> : null}
    </a>
  );
}

const SLOTS = ['09:00–11:00', '11:00–13:00', '14:00–16:00', '16:00–18:00'];

const BOOK_STEPS = [
  { label: 'Car', title: 'Which car is it?', hint: 'Brand and model open the right checklist.' },
  { label: 'Contact', title: 'How do we reach you?', hint: 'The visit note and the PDF go here.' },
  { label: 'Visit', title: 'Where is the car?', hint: 'Address, then a day and a time.' },
  { label: 'Pay', title: 'Confirm and pay', hint: 'Engine size sets the price. Add-ons are optional.' },
];

const fieldClass = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-[14px] font-medium text-slate-900 outline-none focus:border-[#3083ff]';
const tightField = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 outline-none focus:border-[#3083ff]';

const LOOK = {
  NEW_CAR: {
    kicker: 'New car PDI',
    banner: '/car-pdi.png',
    overlay: 'from-[#0b2a6e]/92 via-[#1853ff]/55 to-[#1853ff]/20',
    title: 'Uncover hidden issues before delivery',
    body: 'Hidden delivery damage, checked before registration.',
    other: { to: INSPECTION_URLS.usedCar, label: 'Used car check' },
    issuesTitle: 'A new car can still have serious issues',
    issuesLead: 'Showroom lights hide what a gauge and a scanner pick up.',
    issues: [
      { icon: Wrench, tone: 'orange', title: 'Engine defects', body: 'Leaks, rough idle and fault codes that a handover walkaround will not show.' },
      { icon: Paintbrush, tone: 'rose', title: 'Transit and paint damage', body: 'Chips, uneven gaps and touch-up that happened on the way to the yard.' },
      { icon: Zap, tone: 'amber', title: 'Electrical faults', body: 'Warning lamps, a drained battery and features that were never switched on.' },
    ],
    checksTitle: 'The PDI checklist covers 300+ checks',
    stepsTitle: 'A new car, checked in 3 steps',
    aboutTitle: 'What is a new car PDI?',
    about: [
      'A pre-delivery inspection is an independent check of a new car before it is registered with the RTO. The engineer works for you, not for the showroom.',
      'The visit covers paint thickness, panel gaps, fluids, the battery, warning lamps and whether the VIN matches the invoice. You get the findings on the spot, then a PDF with scores and photos within 60 minutes.',
      'Once the car is in your name, returning it is much harder. The useful moment to ask for a repair or another vehicle is while the dealer still owns it.',
    ],
  },
  USED_CAR: {
    kicker: 'Used car inspection',
    banner: '/used-cars.png',
    overlay: 'from-[#061a4a]/92 via-[#1853ff]/45 to-[#061a4a]/25',
    title: 'Spot hidden issues before you pay',
    body: 'Accident, flood and paper checks before you pay.',
    other: { to: INSPECTION_URLS.newCar, label: 'New car PDI' },
    issuesTitle: 'Uncover a used car’s true condition',
    issuesLead: 'The listing photo and the test drive leave the expensive faults out.',
    issues: [
      { icon: CarFront, tone: 'orange', title: 'Accident repairs', body: 'Filler, replaced panels and structure damage sitting under a fresh coat of paint.' },
      { icon: Droplets, tone: 'cyan', title: 'Flood and leaks', body: 'Silt, corrosion and wet connectors that a dry cabin on the day of viewing can hide.' },
      { icon: FileText, tone: 'indigo', title: 'Papers that do not match', body: 'RC, insurance, NOC and the chassis number checked against the car, not the advertisement.' },
    ],
    checksTitle: 'The report covers 300+ quality checks',
    stepsTitle: 'A used car, checked in 3 steps',
    aboutTitle: 'What is a used car inspection?',
    about: [
      'A used car inspection is an independent check before you transfer money. The engineer looks for accident repairs, flood signs, stored fault codes, gearbox slip and whether the papers belong to this vehicle.',
      'Paint readings, OBD codes and underbody photos go into one report. Each failed point is named, so you can ask the seller to fix it or walk away with a reason.',
      'The visit happens at your address or the seller’s. You pick the day and the time slot.',
    ],
  },
};

const CHECKS = [
  { key: 'engine', title: 'Engine and mechanical', points: 70, icon: Gauge, tone: 'emerald', items: ['Fluid level and leaks', 'Idle and road noise', 'OBD fault codes', 'Gear shift feel'] },
  { key: 'body', title: 'Body and paint', points: 60, icon: Paintbrush, tone: 'rose', items: ['Paint thickness on every panel', 'Panel gap and hinges', 'Glass stamps', 'Weather seals'] },
  { key: 'electrical', title: 'Electrical and cabin', points: 80, icon: Zap, tone: 'amber', items: ['AC vent temperature', 'Warning lamps', 'Windows and infotainment', 'Battery health'] },
  { key: 'under', title: 'Underbody and brakes', points: 50, icon: Wrench, tone: 'orange', items: ['Rust and sump leaks', 'Suspension bushes', 'Brake disc condition', 'Exhaust mounts'] },
  { key: 'docs', title: 'Documents and VIN', points: 40, icon: FileText, tone: 'indigo', items: ['VIN on glass, bay and pillar', 'Invoice or RC match', 'Insurance and NOC', 'Chassis to engine match'] },
  { key: 'tyres', title: 'Tyres and battery', points: 30, icon: BatteryCharging, tone: 'cyan', items: ['Tread depth', 'DOT age against the car', 'Cold cranking health', 'Charging voltage'] },
];

const HOW = [
  { icon: CalendarCheck, tone: 'violet', title: 'Book the visit', body: 'Share the car, the place and a time. A new car is checked at the yard. A used car is checked where it is parked.' },
  { icon: ClipboardCheck, tone: 'emerald', title: 'The engineer checks it', body: 'A certified engineer runs the checklist with a paint gauge, a scanner and a camera, and photographs anything that fails.' },
  { icon: FileCheck2, tone: 'blue', title: 'You get the report', body: 'You hear the findings first. The PDF with scores and photos arrives within 60 minutes.' },
];

const INSIGHTS = [
  { icon: ShieldCheck, tone: 'blue', title: 'Independent of the seller', body: 'The engineer is booked by you. The showroom and the seller do not write the score.' },
  { icon: ScanLine, tone: 'cyan', title: 'Tools, not a walkaround', body: 'Paint thickness, fault codes, battery health and vent temperature are recorded as numbers.' },
  { icon: BadgeCheck, tone: 'emerald', title: 'A report you can use', body: 'Pass and fail by section, with photos, so you can ask for a repair or walk away.' },
  { icon: FileCheck2, tone: 'violet', title: 'Ready in 60 minutes', body: 'The briefing happens on site or by phone. The PDF follows the same day.' },
];

const PAGE_FAQS = {
  NEW_CAR: [
    ['Why inspect a brand-new car?', 'Shipping and yard storage leave chips, leaks and weak batteries that are easy to miss at delivery. Registration locks the car to your name, so the useful moment to reject or repair it is before the RTO entry.'],
    ['What does the checklist cover?', 'Paint on every panel, fluids, warning lamps, battery health, panel gaps and a VIN match against the invoice. OBD scanning is an optional add-on.'],
    ['When should I book?', 'Before the car is registered, while the dealer still owns it. That is when a failed point can still be repaired or the car exchanged.'],
    ['When do I receive the report?', 'The engineer briefs you first. The PDF with scores and photos is sent within 60 minutes of the inspection ending.'],
  ],
  USED_CAR: [
    ['What does a used car inspection catch?', 'Accident repairs under the paint, flood signs, stored fault codes, gearbox slip and papers that do not match the vehicle in front of the engineer.'],
    ['Where does the inspection happen?', 'At your address or the seller’s location. You choose the date and a time slot when you book.'],
    ['What is in the report?', 'A score for each section, the readings that failed, and photos of the fault. You can take that to the seller before you pay.'],
    ['When do I receive the report?', 'The engineer briefs you first. The PDF with scores and photos is sent within 60 minutes of the inspection ending.'],
  ],
};

const TRUST = [
  [ShieldCheck, 'Independent engineer'],
  [ClipboardCheck, '300+ checks'],
  [FileCheck2, 'Report in 60 minutes'],
];

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name || '';
}

function visitDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const { requireAuth } = useAuthGuard();
  const user = useSelector((state) => state.auth.user);
  const type = pathname.includes('used-car-inspection') ? 'USED_CAR' : 'NEW_CAR';
  usePageMeta(type === 'NEW_CAR' ? {
    title: 'New Car Pre-Delivery Inspection (PDI) | 4tyrezz',
    description: 'Book a new car pre-delivery inspection before registration. 300+ checks and a report within 60 minutes.',
    path: INSPECTION_URLS.newCar,
  } : {
    title: 'Used Car Inspection Services | 4tyrezz',
    description: 'Book a used car inspection before you buy. Accident, flood and paper checks, with a report within 60 minutes.',
    path: INSPECTION_URLS.usedCar,
  });
  const { brands, loading: loadingBrands } = useVehicleBrands();
  const { cities } = useReferenceData();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    brand: params.get('brand') || '',
    plate: params.get('plate') || '',
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
  const phone = useIsPhone();
  const [bookOpen, setBookOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [openFaq, setOpenFaq] = useState(0);
  const [modelMenu, setModelMenu] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const keep = new URLSearchParams();
    ['brand', 'model', 'plate'].forEach((key) => {
      const value = params.get(key);
      if (value) keep.set(key, value);
    });
    const query = keep.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    if (`${pathname}${window.location.search}` !== next) navigate(next, { replace: true });
  }, [navigate, params, pathname]);

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
      const bookingForm = { ...form };
      delete bookingForm.plate;
      const { data } = await api.post('/pdi/bookings', {
        ...bookingForm,
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
    if (phone || step === 1) return;
    document.getElementById('book-form')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [phone, step]);

  useEffect(() => {
    if (!phone || !bookOpen || done) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [bookOpen, done, phone]);

  const today = new Date().toISOString().slice(0, 10);
  const meta = BOOK_STEPS[step - 1];
  const look = LOOK[type];

  if (done) {
    return (
      <div className="min-h-[60vh] bg-[#f6f8fb] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f8ef] text-[#0e7a52]">
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <img src="/hero-car.png" alt="" className="mx-auto mt-4 h-24 object-contain" />
          <p className="mt-4 text-[13px] font-medium text-[#3083ff]">Request received</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Payment received. Your inspection is booked</h1>
          <p className="mt-3 text-sm text-slate-500">{done.brand} {done.model} · {done.city} · {inr(done.amount)}</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/profile/pdi" className="inline-flex rounded-xl bg-[#3083ff] px-5 py-3 text-sm font-semibold text-white">
              Track this inspection
            </Link>
            <Link to={INSPECTION_URLS.hub} className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700">
              Back to inspection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] pb-28 lg:pb-0">
      <div className="lg:hidden">
        <LeadHero
          kicker={look.kicker}
          title={look.title}
          subtitle={look.body}
          points={TRUST.map(([, label]) => label)}
          badge="A 4tyrezz inspection"
          image="/hero-car.png"
          imageAlt=""
          footer={(
            <>
              <SampleReportButton wide />
              <Link to={look.other.to} className="mt-2.5 block text-center text-[12px] font-medium text-white/90">
                Looking for a {look.other.label.toLowerCase()}?
              </Link>
            </>
          )}
        />
      </div>
      <section className="relative hidden overflow-hidden text-white lg:block">
        <img src={look.banner} alt="" className="absolute inset-0 h-full w-full object-cover object-[18%_center]" />
        <div className={`absolute inset-0 bg-gradient-to-r ${look.overlay}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/20 lg:hidden" />
        <div className="relative mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-10">
          <div>
            <button type="button" onClick={() => navigate(INSPECTION_URLS.hub)} className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-100 lg:hidden">
              <ChevronLeft className="h-4 w-4" />
              Inspection
            </button>
            <p className="text-[12px] font-medium tracking-wide text-blue-200">{look.kicker}</p>
            <h1 className="mt-2 max-w-xl font-display text-[28px] font-semibold leading-tight lg:text-4xl">{look.title}</h1>
            <p className="mt-3 max-w-md text-sm font-normal leading-relaxed text-blue-100">{look.body}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {TRUST.map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 text-[12px] font-medium">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="h-4 w-4 text-blue-100" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <SampleReportButton className="mt-5" />
            <Link to={look.other.to} className="mt-3 flex text-[13px] font-medium text-blue-200 underline-offset-2 hover:underline">
              Looking for a {look.other.label.toLowerCase()}?
            </Link>
          </div>

          {!phone && (
          <form id="book-form" onSubmit={submit} className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 text-slate-900 shadow-[0_28px_70px_rgba(7,20,51,0.28)] ring-1 ring-slate-900/5 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#6cb2ff] via-[#3083ff] to-[#1853ff]" />
            <p className="text-[13px] font-semibold text-[#3083ff]">{look.kicker}</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#f4f7fb] p-1">
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
                    className={`rounded-full px-1 py-1.5 text-[11px] font-semibold ${on ? 'bg-[#3083ff] text-white' : finished ? 'bg-[#eaf2ff] text-[#1853ff]' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {n}. {item.label}
                  </button>
                );
              })}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{meta.title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{meta.hint}</p>

            {step === 1 && (
              <div className="mt-4 space-y-4">
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
            )}

            {step === 2 && (
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-800">Full name *</span>
                  <input className={fieldClass} placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-800">Mobile number *</span>
                  <input inputMode="numeric" maxLength={10} className={fieldClass} placeholder="10-digit mobile" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-800">Email *</span>
                  <input type="email" className={fieldClass} placeholder="name@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[12px] font-medium text-slate-700">House / flat *</span>
                  <input className={tightField} placeholder="Flat, house no." value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[12px] font-medium text-slate-700">Street / area *</span>
                  <input className={tightField} placeholder="Street, landmark" value={form.area} onChange={(e) => set('area', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[12px] font-medium text-slate-700">City *</span>
                  <select className={tightField} value={form.city} onChange={(e) => set('city', e.target.value)}>
                    {cityNames.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[12px] font-medium text-slate-700">PIN code *</span>
                  <input inputMode="numeric" maxLength={6} className={tightField} placeholder="6-digit PIN" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[12px] font-medium text-slate-700">Date *</span>
                  <input type="date" min={today} className={tightField} value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
                </label>
                <div className="sm:col-span-2">
                  <p className="text-[12px] font-medium text-slate-700">Time *</p>
                  <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => set('timeSlot', slot)}
                        className={`rounded-xl border px-2 py-2 text-[12px] font-semibold ${form.timeSlot === slot ? 'border-[#3083ff] bg-[#eaf2ff] text-[#1853ff]' : 'border-slate-200 text-slate-700'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="mt-3 space-y-2.5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-slate-900">{form.brand} {form.model}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{form.name} · {form.phone}</p>
                  <p className="text-[12px] leading-snug text-slate-500">{[form.addressLine, form.area, form.city, form.pincode].filter(Boolean).join(', ')}</p>
                  <p className="text-[12px] leading-snug text-slate-500">{[visitDate(form.scheduledDate), form.timeSlot].filter(Boolean).join(' · ')}</p>
                </div>
                <InspectionPriceFields
                  cards
                  name="engine-book"
                  pdiType={type}
                  engineBand={form.engineBand}
                  obdScan={form.obdScan}
                  serviceHistory={form.serviceHistory}
                  onChange={set}
                />
              </div>
            )}

            <div className="mt-5 flex gap-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="h-12 w-24 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700">
                  Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={goNext} className="h-12 flex-1 rounded-2xl bg-[#3083ff] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(48,131,255,0.35)] hover:bg-[#1853ff]">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={saving} className="h-12 flex-1 rounded-2xl bg-[#3083ff] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(48,131,255,0.35)] hover:bg-[#1853ff] disabled:opacity-50">
                  {saving ? 'Please wait…' : `Pay ${inr(quote.total)}`}
                </button>
              )}
            </div>
          </form>
          )}
        </div>
      </section>

      <section id="pdi-issues" className="relative z-10 mx-auto max-w-6xl rounded-t-[28px] bg-[#f6f8fb] px-4 pb-8 pt-6 lg:rounded-none lg:bg-transparent lg:px-8 lg:py-12">
        <h2 className="max-w-xl text-[18px] font-semibold leading-snug text-slate-900 lg:text-3xl">{look.issuesTitle}</h2>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500 lg:text-sm">{look.issuesLead}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {look.issues.map(({ icon: Icon, tone, title, body }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <span className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${ICON_TONES[tone]} text-white shadow-[0_10px_18px_rgba(24,83,255,0.18)]`}>
                <Icon className="h-6 w-6" strokeWidth={2.1} />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pdi-checks" className="scroll-mt-24 bg-white py-8 lg:py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <p className="text-[12px] font-medium text-[#3083ff]">300+ checks</p>
          <h2 className="mt-1 max-w-xl text-[18px] font-semibold leading-snug text-slate-900 lg:text-3xl">{look.checksTitle}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map((row) => {
              const Icon = row.icon;
              return (
                <article key={row.key} className="rounded-2xl border border-slate-200 bg-[#f7f9fc] p-4 transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${ICON_TONES[row.tone]} text-white shadow-[0_10px_18px_rgba(24,83,255,0.18)]`}>
                      <Icon className="h-6 w-6" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-slate-900">{row.title}</h3>
                      <p className="text-[11px] font-medium text-[#3083ff]">{row.points} points</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {row.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-[12px] leading-snug text-slate-600">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#178a45]" strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pdi-steps" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8 lg:px-8 lg:py-12">
        <h2 className="text-[18px] font-semibold text-slate-900 lg:text-3xl">{look.stepsTitle}</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {HOW.map(({ icon: Icon, tone, title, body }, index) => (
            <li key={title} className="rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${ICON_TONES[tone]} text-white shadow-[0_10px_18px_rgba(24,83,255,0.18)]`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-[12px] font-semibold text-[#3083ff]">Step {index + 1}</span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pdi-score" className="scroll-mt-24 bg-[#eef5ff] py-8 lg:py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-[12px] font-medium text-[#3083ff]">How the check is done</p>
            <h2 className="mt-1 text-[18px] font-semibold leading-snug text-slate-900 lg:text-3xl">Certified engineers. Measured checks. A report you can act on.</h2>
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-900">Sample score</p>
                <p className="text-2xl font-semibold text-[#0e7a52]">86<span className="text-sm font-medium text-slate-400">/100</span></p>
              </div>
              <ul className="mt-3 space-y-2">
                {[
                  ['Body and paint', 'Pass', 'text-[#0e7a52]'],
                  ['Engine and mechanical', 'Check', 'text-amber-600'],
                  ['Documents and VIN', 'Pass', 'text-[#0e7a52]'],
                ].map(([label, status, tone]) => (
                  <li key={label} className="flex items-center justify-between rounded-xl bg-[#f7f9fc] px-3 py-2 text-[13px]">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className={`font-semibold ${tone}`}>{status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {INSIGHTS.map(({ icon: Icon, tone, title, body }) => (
              <article key={title} className="rounded-2xl border border-[#d5e4ff] bg-white p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                <span className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${ICON_TONES[tone]} text-white shadow-[0_10px_18px_rgba(24,83,255,0.18)]`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-2 lg:px-8 lg:py-12">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 lg:text-3xl">{look.aboutTitle}</h2>
          <div className="mt-3 space-y-3">
            {look.about.map((paragraph) => (
              <p key={paragraph} className="text-[13px] leading-relaxed text-slate-600 lg:text-sm">{paragraph}</p>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 lg:text-3xl">Frequently asked questions</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4">
            {PAGE_FAQS[type].map(([question, answer], index) => (
              <div key={question} className={index ? 'border-t border-slate-100' : ''}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left">
                  <span className="text-[14px] font-medium text-slate-900">{question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && <p className="pb-3.5 text-[13px] leading-relaxed text-slate-500">{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {phone && !bookOpen && (
        <div className="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-40 border-t border-slate-200 bg-white px-3 py-2.5 lg:hidden">
          <button type="button" onClick={() => setBookOpen(true)} className="h-11 w-full rounded-2xl bg-[#3083ff] text-sm font-semibold text-white">
            Book inspection
          </button>
        </div>
      )}

      {phone && bookOpen && typeof document !== 'undefined' && createPortal(
        <form onSubmit={submit} className="fixed inset-0 z-[70] flex flex-col bg-white">
          <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (step > 1 ? setStep(step - 1) : setBookOpen(false))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700"
                aria-label={step > 1 ? 'Previous step' : 'Close'}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[#3083ff]">Step {step} of 4 · {look.kicker}</p>
                <h2 className="truncate text-[16px] font-semibold text-slate-900">{meta.title}</h2>
              </div>
              <button type="button" onClick={() => setBookOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-snug text-slate-500">{meta.hint}</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#f4f7fb] p-1">
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
            {step === 1 && (
              <div className="space-y-4">
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
            )}
            {step === 2 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-800">Full name *</span>
                  <input className={fieldClass} placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-800">Mobile number *</span>
                  <input inputMode="numeric" maxLength={10} className={fieldClass} placeholder="10-digit mobile" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-800">Email *</span>
                  <input type="email" className={fieldClass} placeholder="name@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </label>
              </div>
            )}
            {step === 3 && (
              <div className="grid gap-2.5">
                <label className="block">
                  <span className="text-[12px] font-medium text-slate-700">House / flat *</span>
                  <input className={tightField} placeholder="Flat, house no." value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[12px] font-medium text-slate-700">Street / area *</span>
                  <input className={tightField} placeholder="Street, landmark" value={form.area} onChange={(e) => set('area', e.target.value)} />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block">
                    <span className="text-[12px] font-medium text-slate-700">City *</span>
                    <select className={tightField} value={form.city} onChange={(e) => set('city', e.target.value)}>
                      {cityNames.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[12px] font-medium text-slate-700">PIN code *</span>
                    <input inputMode="numeric" maxLength={6} className={tightField} placeholder="6-digit PIN" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[12px] font-medium text-slate-700">Date *</span>
                  <input type="date" min={today} className={tightField} value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
                </label>
                <div>
                  <p className="text-[12px] font-medium text-slate-700">Time *</p>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => set('timeSlot', slot)}
                        className={`rounded-xl border px-2 py-2 text-[12px] font-semibold ${form.timeSlot === slot ? 'border-[#3083ff] bg-[#eaf2ff] text-[#1853ff]' : 'border-slate-200 text-slate-700'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-2.5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-slate-900">{form.brand} {form.model}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{form.name} · {form.phone}</p>
                  <p className="text-[12px] leading-snug text-slate-500">{[form.addressLine, form.area, form.city, form.pincode].filter(Boolean).join(', ')}</p>
                  <p className="text-[12px] leading-snug text-slate-500">{[visitDate(form.scheduledDate), form.timeSlot].filter(Boolean).join(' · ')}</p>
                </div>
                <InspectionPriceFields
                  cards
                  name="engine-book-mobile"
                  pdiType={type}
                  engineBand={form.engineBand}
                  obdScan={form.obdScan}
                  serviceHistory={form.serviceHistory}
                  onChange={set}
                />
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2 border-t border-slate-100 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {step < 4 ? (
              <button type="button" onClick={goNext} className="h-11 flex-1 rounded-2xl bg-[#3083ff] text-sm font-semibold text-white">
                Continue
              </button>
            ) : (
              <button type="submit" disabled={saving} className="h-11 flex-1 rounded-2xl bg-[#3083ff] text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Please wait…' : `Pay ${inr(quote.total)}`}
              </button>
            )}
          </div>
        </form>,
        document.body,
      )}
    </div>
  );
}
