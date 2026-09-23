import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, Banknote, Clock, FileText, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuthGuard } from '../components/AuthGuardModal';
import CarCard from '../components/CarCard';
import DesignedPageBanner, { BannerActions, BannerButton } from '../components/DesignedPageBanner';
import { isIndianMobile, digitsOnly, whatsappUrl } from '../lib/companyContact';
import {
  BRAND,
  Card,
  Field,
  GhostButton,
  PrimaryButton,
  Section,
  Skeleton,
  formatINR,
  inputClass,
} from '../components/PageShell';

function calcEmi(principal, annualRatePct, months) {
  if (!principal || !months) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

const BENEFITS = [
  { icon: Clock, title: 'Approval in 24–48 hrs', body: 'Digital paperwork with our lending partners, no branch visits for pre-approval.' },
  { icon: Banknote, title: 'Up to 90% funding', body: 'Finance the on-road value of any inspected 4tyrezz listing.' },
  { icon: ShieldCheck, title: 'No hidden charges', body: 'Processing fee and rate are disclosed upfront before you sign.' },
  { icon: FileText, title: 'Minimal documents', body: 'PAN, Aadhaar, 3 months bank statement and income proof.' },
];

const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Bajaj Finserv', 'IDFC First'];
const TENURES = [12, 24, 36, 48, 60, 72, 84];
const FINANCE_FAQS = [
  {
    q: 'Will this enquiry affect my CIBIL score?',
    a: 'No. Submitting this form is a soft request to 4tyrezz. A credit bureau pull happens only if you later sign with a lending partner.',
  },
  {
    q: 'How much down payment do I need?',
    a: 'Most used-car loans start at about 10% down. A higher down payment lowers EMI and improves approval odds.',
  },
  {
    q: 'How fast is approval?',
    a: 'Complete documents typically get a decision in 24–48 hours from our partner banks. You talk only to the 4tyrezz finance desk.',
  },
  {
    q: 'Can I finance any car on 4tyrezz?',
    a: 'Yes — every live inspected listing is eligible. Open the car page or use this calculator, then apply once.',
  },
];

const DOCUMENTS = [
  'PAN card and Aadhaar card',
  'Last 3 months bank statement',
  'Latest 2 salary slips (or 2 years ITR if self-employed)',
  'Passport-size photograph',
  'Address proof (utility bill / rent agreement)',
];

export default function Finance() {
  const [meta, setMeta] = useState({ defaultInterestRate: 10.5, defaultTenureMonths: 60, minDownPaymentPercent: 10 });
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);

  const [price, setPrice] = useState(600000);
  const [downPayment, setDownPayment] = useState(120000);
  const [months, setMonths] = useState(60);
  const [rate, setRate] = useState(10.5);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', employment: 'Salaried', monthlyIncome: '',
    bankName: '', cibilBracket: '650-750',
  });
  const [submitting, setSubmitting] = useState(false);
  const { requireAuth } = useAuthGuard();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const downPct = price ? Math.round((downPayment / price) * 100) : 0;

  useEffect(() => {
    api
      .get('/meta/finance')
      .then((r) => {
        setMeta(r.data);
        setRate(r.data.defaultInterestRate ?? 10.5);
        setMonths(r.data.defaultTenureMonths ?? 60);
      })
      .catch(() => {});

    api
      .get('/cars', { params: { limit: 8, sort: '-createdAt' } })
      .then((r) => setCars(r.data.cars || r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingCars(false));
  }, []);

  const loanAmount = Math.max(price - downPayment, 0);

  const { emi, totalPayable, totalInterest } = useMemo(() => {
    const monthly = calcEmi(loanAmount, rate, months);
    const payable = monthly * months;
    return {
      emi: Math.round(monthly),
      totalPayable: Math.round(payable),
      totalInterest: Math.round(payable - loanAmount),
    };
  }, [loanAmount, rate, months]);

  const submit = () => {
    if (!form.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!isIndianMobile(form.phone)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    requireAuth(async () => {
      setSubmitting(true);
      try {
        await api.post('/enquiries', {
          type: 'finance',
          ...form,
          employmentType: form.employment,
          tenureMonths: months,
          loanAmount,
          downPayment,
          leadSource: 'finance_page',
          monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : null,
          message: `Loan ${formatINR(loanAmount)} · ${months} months · EMI ~${formatINR(emi)} @ ${rate}%`,
          meta: { price, downPayment, loanAmount, months, rate, emi, bankName: form.bankName, cibilBracket: form.cibilBracket },
        });
        toast.success('Finance enquiry submitted. Our team will call you shortly.');
        setForm({ name: '', phone: '', email: '', city: '', employment: 'Salaried', monthlyIncome: '', bankName: '', cibilBracket: '650-750' });
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not submit enquiry');
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <div className="bg-slate-50">
      <DesignedPageBanner
        src="/car-finance.png"
        alt="Car finance on 4tyrezz"
        eyebrow="Car Finance"
        title="Easy vehicle loans on every"
        accent="inspected car"
        subtitle={`Indicative rates from ${meta.defaultInterestRate}% p.a. with tenures up to 84 months. Calculate EMI, then get a callback from our finance desk.`}
        points={[
          { icon: Clock, label: '24–48 hr approval' },
          { icon: Banknote, label: 'Up to 90% funding' },
          { icon: ShieldCheck, label: 'No hidden charges' },
          { icon: FileText, label: 'Minimal documents' },
        ]}
      >
        <BannerActions>
          <BannerButton href="#emi-calculator">Calculate EMI</BannerButton>
          <BannerButton href="#apply" ghost>Apply for a loan</BannerButton>
        </BannerActions>
      </DesignedPageBanner>

      <Section eyebrow="How it works" title="Three simple steps">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            ['01', 'Pick a car', 'Choose any inspected 4tyrezz listing. The asking price feeds the EMI calculator automatically.'],
            ['02', 'Plan your EMI', `Indicative rates from ${meta.defaultInterestRate}% p.a., tenure up to 84 months. Adjust down payment until the monthly amount fits.`],
            ['03', 'Talk to our desk', 'Submit one form. 4tyrezz matches you with a lending partner and calls you back — you never deal with a dealer for paperwork.'],
          ].map(([n, title, body]) => (
            <Card key={n} className="p-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#3083ff]">{n}</span>
              <h3 className="font-black text-slate-900 text-base mt-2">{title}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-8">
          <a href="#emi-calculator">
            <PrimaryButton>Calculate EMI</PrimaryButton>
          </a>
          <a href="#apply">
            <GhostButton>Apply for a loan</GhostButton>
          </a>
        </div>
      </Section>

      <Section eyebrow="Why finance with us" title="Built for used-car buyers" bg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
              </div>
              <h3 className="font-black text-slate-900 text-sm mt-4">{title}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div id="emi-calculator" className="scroll-mt-24">
        <Section eyebrow="Plan your budget" title="Car EMI Calculator">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
            <Card className="p-6 space-y-6" highlighted>
              <SliderRow
                label="Car price"
                value={formatINR(price)}
                min={100000}
                max={5000000}
                step={25000}
                sliderValue={price}
                onChange={(v) => {
                  setPrice(v);
                  setDownPayment((d) => Math.min(d, v));
                }}
                minLabel="₹1 L"
                maxLabel="₹50 L"
              />
              <SliderRow
                label={`Down payment (${downPct}%)`}
                value={formatINR(downPayment)}
                min={0}
                max={price}
                step={10000}
                sliderValue={downPayment}
                onChange={setDownPayment}
                minLabel="₹0"
                maxLabel={formatINR(price)}
              />
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Tenure</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TENURES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition ${
                        months === m
                          ? 'bg-[#3083ff] text-white border-[#3083ff]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#3083ff]/50'
                      }`}
                    >
                      {m / 12}Y
                    </button>
                  ))}
                </div>
                <SliderRow
                  label=""
                  value={`${months} months`}
                  min={12}
                  max={84}
                  step={6}
                  sliderValue={months}
                  onChange={setMonths}
                  minLabel="12 months"
                  maxLabel="84 months"
                />
              </div>
              <SliderRow
                label="Interest rate"
                value={`${rate}% p.a.`}
                min={7}
                max={20}
                step={0.25}
                sliderValue={rate}
                onChange={setRate}
                minLabel="7%"
                maxLabel="20%"
              />
            </Card>

            <Card className="p-6 flex flex-col" highlighted>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Your monthly EMI</p>
              <p className="font-black text-slate-900 text-2xl lg:text-4xl tracking-tight mt-1">
                {formatINR(emi)}
                <span className="text-sm font-extrabold text-slate-400 ml-1.5">/month</span>
              </p>

              <div className="mt-6 space-y-3">
                <SummaryRow label="Loan amount" value={formatINR(loanAmount)} />
                <SummaryRow label="Total interest" value={formatINR(totalInterest)} accent />
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-sm font-black text-slate-900">Total payable</span>
                  <span className="text-sm font-black text-slate-900">{formatINR(totalPayable)}</span>
                </div>
              </div>

              <div className="mt-6 h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="h-full bg-slate-900"
                  style={{ width: `${totalPayable ? (loanAmount / totalPayable) * 100 : 0}%` }}
                />
                <div className="h-full flex-1" style={{ backgroundColor: BRAND }} />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-2">
                <span>Principal</span>
                <span>Interest</span>
              </div>

              <div className="mt-auto pt-6">
                <a href="#apply" className="block">
                  <PrimaryButton className="w-full">Get this loan approved</PrimaryButton>
                </a>
                <p className="text-[11px] font-semibold text-slate-400 mt-3 leading-relaxed">
                  Indicative only. Final rate, processing fee and eligibility depend on your credit profile and the
                  lending partner.
                </p>
              </div>
            </Card>
          </div>
        </Section>
      </div>

      <div id="apply" className="scroll-mt-24">
        <Section eyebrow="Get started" title="Apply for car finance" bg>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
            <Card className="p-6" highlighted>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name">
                  <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Mobile number">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => set('phone', digitsOnly(e.target.value))}
                    placeholder="10-digit mobile"
                  />
                </Field>
                <Field label="Email">
                  <input className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
                </Field>
                <Field label="City">
                  <input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Hyderabad" />
                </Field>
                <Field label="Preferred bank">
                  <select className={inputClass} value={form.bankName} onChange={(e) => set('bankName', e.target.value)}>
                    <option value="">Any partner bank</option>
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label="CIBIL bracket">
                  <select className={inputClass} value={form.cibilBracket} onChange={(e) => set('cibilBracket', e.target.value)}>
                    <option>Below 650</option>
                    <option>650-750</option>
                    <option>750-800</option>
                    <option>800+</option>
                    <option>Not sure</option>
                  </select>
                </Field>
                <Field label="Employment type">
                  <select className={inputClass} value={form.employment} onChange={(e) => set('employment', e.target.value)}>
                    <option>Salaried</option>
                    <option>Self-employed</option>
                    <option>Business owner</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Monthly income" hint="Helps us match the right lender">
                  <input className={inputClass} value={form.monthlyIncome} onChange={(e) => set('monthlyIncome', e.target.value)} placeholder="₹ per month" />
                </Field>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Your selection</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  {formatINR(loanAmount)} over {months} months · EMI {formatINR(emi)} @ {rate}% p.a.
                </p>
              </div>

              <PrimaryButton className="w-full mt-5" disabled={submitting} onClick={submit}>
                {submitting ? 'Submitting…' : 'Apply for finance'}
              </PrimaryButton>
              <a
                href={whatsappUrl(
                  `Hi 4tyrezz, I want car finance. Loan ${formatINR(loanAmount)} over ${months} months. EMI ~${formatINR(emi)} @ ${rate}% p.a.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-xs font-black uppercase tracking-wider text-[#3083ff]"
              >
                Or apply on WhatsApp →
              </a>
            </Card>

            <Card className="p-6">
              <h3 className="font-black text-slate-900 text-base">Documents you'll need</h3>
              <ul className="mt-4 space-y-3">
                {DOCUMENTS.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm font-semibold text-slate-600">
                    <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND }} strokeWidth={2.5} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  Already found a car? Open any listing and use the in-page EMI calculator to apply against that
                  specific vehicle.
                </p>
                <Link to="/cars" className="font-black text-sm mt-3 inline-flex items-center gap-1" style={{ color: BRAND }}>
                  Browse inspected cars <span>→</span>
                </Link>
              </div>
            </Card>
          </div>
        </Section>
      </div>

      <Section eyebrow="Ready to finance" title="Cars you can drive home on EMI" viewAllHref="/cars">
        {loadingCars ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : cars.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cars.slice(0, 8).map((c) => (
              <CarCard key={c._id} car={c} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">
              No listings published yet — new inspected stock is added weekly.
            </p>
          </Card>
        )}
      </Section>

      <Section eyebrow="Lending partners" title="Banks we work with" bg>
        <div className="flex flex-wrap justify-center gap-3">
          {BANKS.map((b) => (
            <span
              key={b}
              className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm"
            >
              {b}
            </span>
          ))}
        </div>
        <p className="text-center text-xs font-medium text-slate-500 mt-4">
          Final lender depends on your profile. 4tyrezz matches you — you never negotiate with a dealer for the loan.
        </p>
      </Section>

      <Section eyebrow="Help" title="Finance questions">
        <div className="max-w-3xl space-y-3">
          {FINANCE_FAQS.map((f) => (
            <details key={f.q} className="bg-white border border-slate-200 rounded-xl p-5 group cursor-pointer shadow-xs">
              <summary className="font-extrabold text-slate-900 flex justify-between items-center text-sm sm:text-base">
                <span>{f.q}</span>
                <span className="w-7 h-7 rounded-full bg-slate-100 group-open:bg-[#3083ff] group-open:text-white flex items-center justify-center text-slate-700 font-bold text-sm transition-colors shrink-0 ml-4">
                  +
                </span>
              </summary>
              <p className="text-xs sm:text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed font-medium">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <div className="lg:hidden h-16" />
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white/60">Indicative EMI</p>
            <p className="font-black text-lg leading-tight">{formatINR(emi)}<span className="text-xs font-bold text-white/60"> /mo</span></p>
          </div>
          <a href="#apply" className="shrink-0 px-4 py-2 rounded-xl bg-[#3083ff] text-xs font-black uppercase tracking-wider">
            Apply now
          </a>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, sliderValue, onChange, minLabel, maxLabel }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        {label ? <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span> : <span />}
        <span className="font-black text-slate-900 text-sm">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#3083ff] cursor-pointer"
      />
      <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: accent ? BRAND : '#0f172a' }}
        />
        {label}
      </span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
