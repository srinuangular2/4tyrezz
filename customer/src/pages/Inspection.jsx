import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BatteryCharging,
  CalendarCheck,
  Camera,
  ChevronDown,
  CircleDot,
  FileCheck2,
  Gauge,
  Phone,
  ScanLine,
  ShieldCheck,
  Thermometer,
  X,
  Check,
} from 'lucide-react';
import HowItWorks from '../components/mobile/HowItWorks';
import useReferenceData from '../hooks/useReferenceData';
import InspectionPriceFields from '../components/pdi/InspectionPriceFields';
import { ENGINE_PRICE, PRIMARY_CITIES, bookPath, inr, quoteInspection } from '../lib/pdiPricing';

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

const STEPS = [
  ['01', 'Book and schedule', 'Pick a dealer yard or a home address, then choose a date and a time slot.'],
  ['02', 'On-site inspection', 'A certified engineer runs the 300+ point checklist and photographs anything that fails.'],
  ['03', 'Verbal briefing', 'You get a call or a walk-through of critical findings before you sign the dealer form.'],
  ['04', 'Digital PDF report', 'Pass and fail scores, defect photos and paint readings arrive within 60 minutes.'],
];

const FAQS = [
  ['Why inspect a brand-new car?', 'Shipping and yard storage create damage that is easy to miss at delivery. Registration locks the car to your name, so the useful moment to reject or repair it is before the RTO entry.'],
  ['What is different about a used car inspection?', 'Used car checks look for accident structure, flood history, stored OBD codes, gearbox slip and whether RC, NOC and insurance match the vehicle in front of the engineer.'],
  ['Are the diagnostic tools included?', 'Paint gauge, battery test, AC measurement, tyre age and the PDF report are included. OBD scanning and used-car service history are optional add-ons.'],
  ['How is the price calculated?', `The inspection is ${inr(ENGINE_PRICE.UPTO_1249)} for engines up to 1249cc and ${inr(ENGINE_PRICE.ABOVE_1249)} above that. OBD scanning is ${inr(600)}. Used-car service history is ${inr(400)}.`],
  ['When do I receive the report?', 'The engineer briefs you on site or by phone, then the PDF with scores and photos is sent within 60 minutes of the inspection ending.'],
];

export default function Inspection() {
  const { cities } = useReferenceData();
  const cityNames = useMemo(() => {
    const fromApi = (cities || []).map((city) => city.name).filter(Boolean);
    return Array.from(new Set([...PRIMARY_CITIES, ...fromApi]));
  }, [cities]);
  const [pdiType, setPdiType] = useState('NEW_CAR');
  const [engineBand, setEngineBand] = useState('UPTO_1249');
  const [obdScan, setObdScan] = useState(true);
  const [serviceHistory, setServiceHistory] = useState(false);
  const [city, setCity] = useState('Hyderabad');
  const [check, setCheck] = useState(CHECKS[0].key);
  const [tool, setTool] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const quote = quoteInspection({ pdiType, engineBand, obdScan, serviceHistory });
  const activeCheck = CHECKS.find((row) => row.key === check) || CHECKS[0];
  const bookHref = bookPath({ pdiType, city, engineBand, obdScan, serviceHistory });
  const setPrice = (key, value) => {
    if (key === 'engineBand') setEngineBand(value);
    if (key === 'obdScan') setObdScan(value);
    if (key === 'serviceHistory') setServiceHistory(value);
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
    <div className="bg-slate-50 pb-36 lg:pb-0">
      <section className="relative overflow-hidden lg:hidden">
        <img src="/car-pdi.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[85%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/25" />
        <div className="relative px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/80">Pre-delivery inspection</p>
          <h1 className="mt-1 max-w-[18rem] text-[15px] font-medium leading-snug text-white">Know the car before you drive it away</h1>
          <p className="mt-1 max-w-[18rem] text-xs font-light leading-snug text-white/90">A full report from a certified engineer, for a new car or a used one.</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {TRUST.map(([label, Icon]) => (
              <li key={label} className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">
                <Icon className="h-3 w-3" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="relative hidden overflow-hidden min-h-[280px] sm:min-h-[420px] lg:block lg:min-h-[520px]">
        <img
          src="/car-pdi.png"
          alt="4tyrezz engineer inspecting a car before delivery"
          className="absolute inset-0 w-full h-full object-cover object-[78%_center] sm:object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2a6e]/92 via-[#1853ff]/55 to-transparent sm:via-[#1853ff]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent sm:hidden" />
        <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20">
          <div className="max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">Pre-delivery inspection</p>
            <h1 className="mt-2 text-2xl sm:text-5xl tracking-tight font-display text-white leading-tight">
              Planning to buy a <span className="font-black"> new or used car</span>?
            </h1>
            <p className="mt-3 text-sm sm:text-lg font-bold text-white leading-snug">
              Make a confident decision with 4tyrezz’s comprehensive car inspection and pre-delivery inspection (PDI) services.
            </p>
            <p className="text-white/85 text-xs sm:text-base font-medium mt-3 leading-relaxed">
              Get a detailed inspection report and know what you’re buying before you drive away.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link to={bookPath({ pdiType: 'NEW_CAR', city, engineBand, obdScan, serviceHistory: false })} className="rounded-xl bg-white text-[#1853ff] font-black text-sm px-5 py-3 text-center">
                Book new car PDI (from {inr(ENGINE_PRICE.UPTO_1249)})
              </Link>
              <Link to={bookPath({ pdiType: 'USED_CAR', city, engineBand, obdScan, serviceHistory })} className="rounded-xl border border-white/40 text-white font-black text-sm px-5 py-3 text-center">
                Book used car inspection (from {inr(ENGINE_PRICE.UPTO_1249)})
              </Link>
            </div>
            <ul className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {TRUST.map(([label, Icon]) => (
                <li key={label} className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white">
                  <Icon className="w-3.5 h-3.5 text-blue-200" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4 px-4 py-4 lg:hidden">
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <p className="text-[12px] font-medium text-[#3083ff]">Start here</p>
          <h2 className="mt-1 text-base font-semibold text-slate-800">Choose the inspection</h2>
          <p className="mt-1 text-[13px] font-normal leading-snug text-slate-500">Pick new or used, then the city and engine. The price updates as you go.</p>

          <div className="mt-4 flex flex-row gap-3">
            {[
              ['NEW_CAR', 'New car PDI', `From ${inr(ENGINE_PRICE.UPTO_1249)}`],
              ['USED_CAR', 'Used car inspection', `From ${inr(ENGINE_PRICE.UPTO_1249)}`],
            ].map(([id, label, hint]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPdiType(id)}
                className={`min-w-0 flex-1 rounded-2xl px-3 py-3 text-left ${pdiType === id ? 'bg-[#3083ff] text-white shadow-md shadow-blue-200' : 'bg-slate-50 text-slate-800'}`}
              >
                <span className="block text-sm font-semibold leading-tight">{label}</span>
                <span className={`mt-1 block text-[11px] font-normal ${pdiType === id ? 'text-white/80' : 'text-slate-500'}`}>{hint}</span>
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-[13px] font-medium text-slate-700">2. Which city?</span>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[14px] font-medium text-slate-900"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              {cityNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>

          <div className="mt-4">
            <InspectionPriceFields
              name="engine-mobile"
              pdiType={pdiType}
              engineBand={engineBand}
              obdScan={obdScan}
              serviceHistory={serviceHistory}
              onChange={setPrice}
            />
          </div>
          <Link to={bookHref} className="mt-3 flex h-11 items-center justify-center rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white">
            Continue to book
          </Link>
          <p className="mt-2 text-center text-[12px] font-normal text-slate-500">Next you pick the car, a time and pay. The report arrives within 60 minutes.</p>
        </div>

        <HowItWorks
          title="How does it work?"
          steps={[
            { icon: CalendarCheck, title: 'Book a time', body: 'Pick the place, date and slot.' },
            { icon: ShieldCheck, title: 'Engineer checks', body: 'Photos and a full checklist on site.' },
            { icon: Phone, title: 'Hear the findings', body: 'A call before you sign anything.' },
            { icon: FileCheck2, title: 'Get the report', body: 'Scores and photos within 60 minutes.' },
          ]}
        />

        <div className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60">
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

      <section className="container-px hidden py-10 lg:block lg:py-14">
        <p className="text-[13px] font-medium text-[#909294] uppercase tracking-[5px] font-display">Why it matters</p>
        <h2 className="mt-2 text-2xl lg:text-4xl font-display text-slate-900">What a PDI protects you from</h2>
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          {WHY.map((card) => (
            <article key={card.title} className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
              <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{card.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[0.8fr_1fr_1fr] bg-[#0f172a] text-white text-[11px] sm:text-xs font-black uppercase tracking-wide">
            <div className="p-3 sm:p-4">Check</div>
            <div className="p-3 sm:p-4">New car PDI</div>
            <div className="p-3 sm:p-4">Used car inspection</div>
          </div>
          {COMPARE.map(([label, fresh, used]) => (
            <div key={label} className="grid grid-cols-[0.8fr_1fr_1fr] border-t border-slate-100 text-xs sm:text-sm">
              <div className="p-3 sm:p-4 font-black text-slate-900">{label}</div>
              <div className="p-3 sm:p-4 text-slate-600">{fresh}</div>
              <div className="p-3 sm:p-4 text-slate-600">{used}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden bg-white py-10 lg:block lg:py-14">
        <div className="container-px">
          <p className="text-[13px] font-medium text-[#909294] uppercase tracking-[5px] font-display">Equipment</p>
          <h2 className="mt-2 text-2xl lg:text-4xl font-display text-slate-900">Tools the engineer brings</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">Tap a tool to see what the reading means on your report.</p>
          <div className="mt-6 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible">
            {TOOLS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setTool(item)}
                  className="snap-start shrink-0 w-[78%] sm:w-[46%] md:w-auto text-left rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm hover:border-[#3083ff]/40"
                >
                  <span className="w-10 h-10 rounded-2xl bg-[#3083ff]/10 text-[#3083ff] inline-flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="mt-3 font-black text-slate-900 text-sm">{item.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-px hidden py-10 lg:block lg:py-14">
        <p className="text-[13px] font-medium text-[#909294] uppercase tracking-[5px] font-display">300+ points</p>
        <h2 className="mt-2 text-2xl lg:text-4xl font-display text-slate-900">What the checklist covers</h2>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {CHECKS.map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={() => setCheck(row.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${check === row.key ? 'bg-[#3083ff] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
            >
              {row.title}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-lg font-black text-slate-900">{activeCheck.title}</h3>
            <p className="text-sm font-black text-[#3083ff]">{activeCheck.points} points</p>
          </div>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2">
            {activeCheck.items.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hidden bg-white py-10 lg:block lg:py-14">
        <div className="container-px grid lg:grid-cols-2 gap-6 items-start">
          <div>
            <p className="text-[13px] font-medium text-[#909294] uppercase tracking-[5px] font-display">After you book</p>
            <h2 className="mt-2 text-2xl lg:text-4xl font-display text-slate-900">From slot to PDF</h2>
            <ol className="mt-6 space-y-3">
              {STEPS.map(([n, title, body]) => (
                <li key={n} className="rounded-2xl border border-slate-200 p-4 flex gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-[#0f172a] text-white text-xs font-black inline-flex items-center justify-center">{n}</span>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <article className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#0f172a] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">Sample report</p>
                <h3 className="font-black">4tyrezz digital inspection</h3>
              </div>
              <p className="text-3xl font-black">86<span className="text-sm text-blue-200">/100</span></p>
            </div>
            <ul className="bg-white divide-y divide-slate-100">
              {[
                ['Body and paint', 'Pass', '118 μm on the rear door, above factory band'],
                ['Engine and mechanical', 'Fail', 'Stored misfire code on cylinder 2'],
                ['Electrical and interior', 'Pass', 'AC vent 8°C, windows and lamps working'],
                ['Underbody', 'Pass', 'No sump leak, discs within limit'],
                ['VIN and documents', 'Pass', 'Glass, pillar and invoice match'],
              ].map(([label, status, note]) => (
                <li key={label} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{note}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ${status === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section id="pdi-price" className="container-px hidden py-10 lg:block lg:py-14">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-8">
          <p className="text-[13px] font-medium text-[#909294] uppercase tracking-[5px] font-display">Price</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Instant inspection quote</h2>
          <p className="mt-2 text-sm text-slate-500">Choose the engine size, then add OBD scanning or service history. The total updates before you book.</p>
          <div className="mt-5 grid sm:grid-cols-2 gap-2">
            {[['NEW_CAR', `New car PDI · from ${inr(ENGINE_PRICE.UPTO_1249)}`], ['USED_CAR', `Used car · from ${inr(ENGINE_PRICE.UPTO_1249)}`]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setPdiType(id)} className={`rounded-2xl px-4 py-3 text-sm font-black text-left ${pdiType === id ? 'bg-[#3083ff] text-white' : 'bg-slate-50 text-slate-800'}`}>
                {label}
              </button>
            ))}
          </div>
          <label className="block mt-4">
            <span className="text-xs font-black text-slate-700">City</span>
            <select className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={city} onChange={(event) => setCity(event.target.value)}>
              {cityNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <div className="mt-5">
            <InspectionPriceFields
              name="engine-desktop"
              pdiType={pdiType}
              engineBand={engineBand}
              obdScan={obdScan}
              serviceHistory={serviceHistory}
              onChange={setPrice}
            />
          </div>
          <Link to={bookHref} className="mt-5 inline-flex w-full sm:w-auto justify-center rounded-xl bg-[#3083ff] text-white font-black text-sm px-6 py-3">
            Book this inspection
          </Link>
        </div>
      </section>

      <section className="hidden bg-white py-10 lg:block lg:py-14">
        <div className="container-px max-w-3xl">
          <h2 className="text-2xl font-black text-slate-900">Questions before you book</h2>
          <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
            {FAQS.map(([question, answer], index) => (
              <div key={question}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="w-full flex items-center justify-between gap-4 py-4 text-left">
                  <span className="font-bold text-slate-900 text-sm">{question}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && <p className="pb-4 text-sm text-slate-600 leading-relaxed">{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lg:hidden fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-40 border-t border-slate-200 bg-white px-3 py-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
        <Link to={bookHref} className="flex h-11 items-center justify-center rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white">
          Book this inspection · {inr(quote.total)}
        </Link>
      </div>

      {tool && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setTool(null)}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black text-slate-900 text-lg">{tool.title}</h3>
              <button type="button" onClick={() => setTool(null)} className="w-8 h-8 rounded-full bg-slate-100 inline-flex items-center justify-center" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{tool.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}
