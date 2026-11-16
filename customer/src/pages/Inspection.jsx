import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BatteryCharging,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileCheck2,
  Gauge,
  ScanLine,
  ShieldCheck,
  Thermometer,
  X,
  Check,
} from 'lucide-react';
import LeadHero from '../components/mobile/LeadHero';
import { ENGINE_PRICE, INSPECTION_URLS, bookPath, inr } from '../lib/pdiPricing';
import { usePageMeta } from '../lib/pageMeta';

const TRUST = [
  ['100% independent inspection', ShieldCheck],
  ['Digital PDF report in 60 mins', FileCheck2],
  ['Certified auto engineers', BadgeCheck],
];

const WHY = [
  {
    title: 'The showroom myth',
    body: 'A car can leave the factory in good shape and still arrive with hidden defects. Hauler straps, yard storage and last-mile handling leave water leaks, paint chips and panel damage that a walkaround under showroom lights will miss.',
  },
  {
    title: 'Inspect before registration',
    body: 'Once the car is registered with the RTO in your name, it cannot be returned or exchanged. A report before registration is the leverage to ask for another vehicle or a full rectification while the dealer still owns the car.',
  },
];

const COMPARE = [
  ['Where', 'Dealer yard, before RTO registration', 'Your address or the seller’s location'],
  ['Paint', 'Micron depth, factory gaps, transit scratches', 'Repaint, filler and panel replacement'],
  ['Mechanical', 'Manufacturing defects, battery health, VIN decode', 'Structure, flood signs, OBD codes, gear slip'],
  ['Papers', 'Invoice month and chassis match', 'RC, NOC, insurance and service notes'],
];

const TOOLS = [
  {
    icon: Gauge,
    title: 'Digital ultrasonic paint gauge',
    body: 'Reads paint thickness in microns on every panel to flag filler, respray and transit touch-up.',
    detail: 'Factory paint sits in a tight micron band. A repaired panel jumps well above that band even when the colour looks perfect. The inspector logs a reading for each panel so the report shows which ones were refinished.',
  },
  {
    icon: ScanLine,
    title: 'Professional OBD2 scanner',
    body: 'Plugs into the ECU for active and cleared fault codes, misfires, airbag errors and odometer flags.',
    detail: 'A cleared code can still leave a freeze-frame. The scan covers engine, transmission, ABS and airbag modules, then the report lists each code in plain language.',
  },
  {
    icon: BatteryCharging,
    title: 'Battery and alternator analyser',
    body: 'Measures cold cranking amps, battery health percentage and charging voltage.',
    detail: 'A new car can sit in a yard long enough to weaken the battery. The analyser checks whether the battery can crank and whether the alternator holds charge under load.',
  },
  {
    icon: Thermometer,
    title: 'AC temperature and airflow meter',
    body: 'Records vent temperature and airflow so cooling is a number, not a guess.',
    detail: 'The inspector measures vent output after a set idle and notes whether the cabin reaches a proper drop. Weak airflow points to a blower, filter or leak before you accept the car.',
  },
  {
    icon: CircleDot,
    title: 'Tread depth and tyre age check',
    body: 'Measures tread and reads the DOT date against the invoice or registration month.',
    detail: 'Tyres can be replaced with older stock. The DOT week and year are compared with the car’s build or invoice date, and tread depth is recorded per tyre.',
  },
  {
    icon: Camera,
    title: 'Borescope inspection camera',
    body: 'Looks into engine bays and underbody areas for leaks and corrosion you cannot see standing up.',
    detail: 'The camera reaches sump seams, subframe corners and hose joints. Photos of any wetness or rust go into the PDF with the panel they belong to.',
  },
];

const CHECKS = [
  {
    key: 'body',
    title: 'Body and paintwork',
    points: 60,
    items: ['Paint thickness on every panel', 'Panel gap uniformity', 'Glass manufacturing stamps', 'Door hinge play', 'Weather-strip sealing'],
  },
  {
    key: 'engine',
    title: 'Engine and mechanical',
    points: 70,
    items: ['Fluid level and condition', 'Hose integrity', 'Idle and road noise', 'OBD2 fault codes', 'Gear shift smoothness'],
  },
  {
    key: 'electrical',
    title: 'Electrical and interior',
    points: 80,
    items: ['AC vent temperature', 'Infotainment response', 'Power windows and speakers', 'Warning lamps', 'Seatbelt pre-tensioners'],
  },
  {
    key: 'under',
    title: 'Underbody and suspension',
    points: 50,
    items: ['Underbody rust', 'Sump and cooler leaks', 'Suspension bush wear', 'Exhaust mounts', 'Brake disc thickness'],
  },
  {
    key: 'docs',
    title: 'Documents and VIN',
    points: 40,
    items: ['VIN on glass, bay and pillar', 'Build month decoding', 'Invoice cross-check', 'RC, NOC and insurance', 'Chassis to engine match'],
  },
];

const FAQS = [
  ['Why inspect a brand-new car?', 'Shipping and yard storage create damage that is easy to miss at delivery. Registration locks the car to your name, so the useful moment to reject or repair it is before the RTO entry.'],
  ['What is different about a used car inspection?', 'Used car checks look for accident structure, flood history, stored OBD codes, gearbox slip and whether RC, NOC and insurance match the vehicle in front of the engineer.'],
  ['Are the diagnostic tools included?', 'Paint gauge, battery test, AC measurement, tyre age and the PDF report are included. OBD scanning and used-car service history are optional add-ons.'],
  ['How is the price calculated?', `The inspection is ${inr(ENGINE_PRICE.UPTO_1249)} for engines up to 1249cc and ${inr(ENGINE_PRICE.ABOVE_1249)} above that. OBD scanning is ${inr(600)}. Used-car service history is ${inr(400)}.`],
  ['When do I receive the report?', 'The engineer briefs you on site or by phone, then the PDF with scores and photos is sent within 60 minutes of the inspection ending.'],
];

const INSPECT = '#0e7a52';

const INSPECT_WHY = [
  { icon: ShieldCheck, title: 'An independent check', body: 'The engineer works for you, not for the seller or the showroom.' },
  { icon: FileCheck2, title: 'A report in 60 minutes', body: 'Scores, photos and paint readings arrive after the visit.' },
  { icon: BadgeCheck, title: 'Decide before you pay', body: 'Use the report before registration, or before you transfer the money.' },
];

const INSPECT_FINDS = [
  { icon: Gauge, title: 'Engine defects', body: 'Idle, leaks, fault codes and gearbox slip a walkaround will miss.' },
  { icon: ShieldCheck, title: 'Paint and factory issues', body: 'Panel gaps, respray and damage picked up on the way to you.' },
  { icon: FileCheck2, title: 'Hidden accident history', body: 'Structure, flood signs, and papers that do not match the car.' },
];

const INSPECT_STEPS = [
  { title: 'Choose new or used', body: 'A new car is checked for delivery damage. A used car is checked for accident history.' },
  { title: 'Book a time', body: 'Share where the car is, then pick a date and a slot.' },
  { title: 'The engineer checks it', body: 'A certified engineer runs the checklist and photographs anything that fails.' },
  { title: 'You get the report', body: 'You hear the findings first. The PDF with scores arrives within 60 minutes.' },
];

export default function Inspection() {
  const navigate = useNavigate();
  usePageMeta({
    title: 'Pre-Delivery Inspection | 4tyrezz',
    description: 'Book a new car PDI or a used car inspection. 300+ checks and a report within 60 minutes.',
    path: INSPECTION_URLS.hub,
  });
  const [pdiType] = useState('NEW_CAR');
  const [engineBand] = useState('UPTO_1249');
  const [obdScan] = useState(true);
  const [serviceHistory] = useState(false);
  const [city] = useState('Hyderabad');
  const [check, setCheck] = useState(CHECKS[0].key);
  const [tool, setTool] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const chooseType = (type) => {
    navigate(bookPath({ pdiType: type, city, engineBand, obdScan, serviceHistory }));
  };

  useEffect(() => {
    if (!tool) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setTool(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tool]);

  return (
    <div className="bg-[#f6f8fb] pb-36 lg:pb-0">
      <div className="lg:hidden">
        <LeadHero
          kicker="Car inspection"
          title="Buy safe before"
          accent="you take the car"
          points={['Inspected before delivery', 'Report within 60 minutes', 'New car or used car']}
          badge="A 4tyrezz inspection"
          image="/hero-car.png"
          imageAlt=""
        />
      </div>
      <section className="relative hidden min-h-[280px] overflow-hidden sm:min-h-[420px] lg:block lg:min-h-[520px]">
        <img
          src="/car-pdi.png"
          alt="4tyrezz engineer inspecting a car before delivery"
          className="absolute inset-0 h-full w-full object-cover object-[78%_center] sm:object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2a6e]/92 via-[#1853ff]/55 to-transparent sm:via-[#1853ff]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent sm:hidden" />
        <div className="container-px relative mx-auto px-4 py-8 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">Pre-delivery inspection</p>
            <h1 className="mt-2 font-display text-2xl leading-tight tracking-tight text-white sm:text-5xl">
              Planning to buy a <span className="font-bold"> new or used car</span>?
            </h1>
            <p className="mt-3 text-sm font-bold leading-snug text-white sm:text-lg">
              Make a confident decision with 4tyrezz’s comprehensive car inspection and pre-delivery inspection (PDI) services.
            </p>
            <p className="mt-3 text-xs font-medium leading-relaxed text-white/85 sm:text-base">
              Get a detailed inspection report and know what you’re buying before you drive away.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link to={bookPath({ pdiType: 'NEW_CAR', city, engineBand, obdScan, serviceHistory: false })} className="rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-[#1853ff]">
                Book new car PDI (from {inr(ENGINE_PRICE.UPTO_1249)})
              </Link>
              <Link to={bookPath({ pdiType: 'USED_CAR', city, engineBand, obdScan, serviceHistory })} className="rounded-xl border border-white/40 px-5 py-3 text-center text-sm font-black text-white">
                Book used car inspection (from {inr(ENGINE_PRICE.UPTO_1249)})
              </Link>
            </div>
            <ul className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {TRUST.map(([label, Icon]) => (
                <li key={label} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white">
                  <Icon className="h-3.5 w-3.5 text-blue-200" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="lg:hidden">
        <div className="relative z-10 -mt-7 rounded-t-[28px] bg-white px-4 pb-5 pt-5">
          <h2 className="text-[16px] font-semibold text-slate-900">Choose your car type</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {[
              ['NEW_CAR', 'Brand new car', 'Factory defects and delivery damage', 'from-[#fff1f4] to-[#ffe4ea]'],
              ['USED_CAR', 'Used car', 'Accident, flood and paper checks', 'from-[#eaf2ff] to-[#dce8ff]'],
            ].map(([id, label, body, tone]) => (
              <button
                key={id}
                type="button"
                onClick={() => chooseType(id)}
                className={`flex min-h-[148px] flex-col rounded-2xl border border-slate-200 bg-gradient-to-b p-3 text-left ${tone}`}
              >
                <p className="text-[13px] font-semibold leading-tight text-slate-900">{label}</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{body}</p>
                <span className="relative mt-auto flex h-14 items-end">
                  <span className="absolute bottom-1 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#3083ff] text-white">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                  <img src="/hero-car.png" alt="" className="ml-auto h-12 w-[78%] object-contain object-right" />
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5">
            <h3 className="text-[14px] font-semibold leading-snug text-slate-900">What the inspection looks for</h3>
            <div className="mt-2.5 space-y-2">
              {INSPECT_FINDS.map(({ icon: Icon, title, body }) => (
                <article key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#3083ff]">
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4 px-4 pb-4 pt-5">
          <h2 className="text-[16px] font-semibold text-slate-900">Why inspect with 4tyrezz?</h2>
          <div className="space-y-3">
            {INSPECT_WHY.map(({ icon: Icon, title, body }) => (
              <article key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d7f5e8] text-[#0e7a52]">
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold leading-snug text-slate-900">{title}</h3>
                  <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">{body}</p>
                </div>
              </article>
            ))}
          </div>
          <h2 className="text-[16px] font-semibold text-slate-900">Book an inspection in 4 easy steps</h2>
          <ol>
            {INSPECT_STEPS.map(({ title, body }, index) => (
              <li key={title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: INSPECT }}>{index + 1}</span>
                  {index < INSPECT_STEPS.length - 1 ? <span className="my-1 w-px flex-1 bg-[#0e7a52]/25" /> : null}
                </div>
                <div className={index < INSPECT_STEPS.length - 1 ? 'pb-4' : ''}>
                  <p className="text-[13px] font-semibold leading-snug text-slate-900">{title}</p>
                  <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60">
          <p className="text-[12px] font-medium text-[#3083ff]">300+ points</p>
          <h2 className="mt-1 text-base font-semibold text-slate-800">What the engineer checks</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CHECKS.map((row) => (
              <article key={row.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">{row.title}</h3>
                  <span className="rounded-full bg-[#e8f1ff] px-2 py-0.5 text-[10px] font-semibold text-[#3083ff]">{row.points} pts</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {row.items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-[12px] font-normal text-slate-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#178a45]" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="hidden lg:block">
      <section className="container-px relative z-10 bg-[#f6f8fb] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <h2 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">
          {pdiType === 'NEW_CAR' ? 'A new car can still have serious issues' : 'Uncover a used car’s real condition'}
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {INSPECT_FINDS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#3083ff]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-base font-black text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-8 lg:py-12">
        <div className="container-px px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">The checklist covers 300+ checks</h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {CHECKS.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => setCheck(row.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${check === row.key ? 'bg-[#3083ff] text-white' : 'border border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                {row.title}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {CHECKS.map((row) => (
              <article key={row.key} className={`rounded-3xl border p-4 ${check === row.key ? 'border-[#3083ff] bg-[#f4f8ff]' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900">{row.title}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#3083ff]">{row.points} pts</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {row.items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-[13px] text-slate-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#178a45]" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0e7a52] text-white">
        <div className="container-px flex flex-col items-start justify-between gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-100">Sample report</p>
            <h2 className="mt-1 font-display text-2xl font-black">See what the PDF looks like before you book</h2>
            <p className="mt-2 max-w-xl text-sm text-emerald-50">Pass and fail scores, paint readings and the photos the engineer takes.</p>
          </div>
          <div className="w-full max-w-sm rounded-3xl bg-white p-4 text-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black">Sample score</p>
              <p className="text-2xl font-black text-[#0e7a52]">86<span className="text-sm text-slate-400">/100</span></p>
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              {[
                ['Body and paint', 'Pass'],
                ['Engine and mechanical', 'Fail'],
                ['Documents and VIN', 'Pass'],
              ].map(([label, status]) => (
                <li key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="font-semibold">{label}</span>
                  <span className={status === 'Pass' ? 'font-black text-emerald-700' : 'font-black text-red-600'}>{status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-px grid gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-12">
        <div>
          <h2 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">Inspection in 3 simple steps</h2>
          <ol className="mt-5 space-y-3">
            {INSPECT_STEPS.slice(0, 3).map(({ title, body }, index) => (
              <li key={title} className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3083ff] text-sm font-black text-white">{index + 1}</span>
                <div>
                  <p className="text-sm font-black text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">What the engineer brings</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {TOOLS.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} type="button" onClick={() => setTool(item)} className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:border-[#3083ff]/40">
                  <Icon className="h-5 w-5 text-[#3083ff]" />
                  <h3 className="mt-2 text-sm font-black text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.body}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 lg:py-12">
        <div className="container-px px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-black text-slate-900">What this inspection covers</h2>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-[0.8fr_1fr_1fr] bg-[#071433] text-[11px] font-black uppercase tracking-wide text-white">
              <div className="p-3">Check</div>
              <div className="p-3">New car PDI</div>
              <div className="p-3">Used car</div>
            </div>
            {COMPARE.map(([label, fresh, used]) => (
              <div key={label} className="grid grid-cols-[0.8fr_1fr_1fr] border-t border-slate-100 text-xs sm:text-sm">
                <div className="p-3 font-black text-slate-900">{label}</div>
                <div className="p-3 text-slate-600">{fresh}</div>
                <div className="p-3 text-slate-600">{used}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {WHY.map((card) => (
              <article key={card.title} className="rounded-3xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-px max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <h2 className="font-display text-2xl font-black text-slate-900">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map(([question, answer], index) => (
            <div key={question}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                <span className="text-sm font-bold text-slate-900">{question}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === index && <p className="pb-4 text-sm leading-relaxed text-slate-600">{answer}</p>}
            </div>
          ))}
        </div>
      </section>
      </div>

      {tool && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-6" onClick={() => setTool(null)}>
          <div className="w-full rounded-t-3xl bg-white p-6 sm:max-w-md sm:rounded-3xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">{tool.title}</h3>
              <button type="button" onClick={() => setTool(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{tool.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}
