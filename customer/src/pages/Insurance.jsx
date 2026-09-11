import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BadgeCheck, CarFront, LifeBuoy, ShieldCheck, Wrench } from 'lucide-react';
import api from '../api/axios';
import { useAuthGuard } from '../components/AuthGuardModal';
import {
  BRAND,
  Card,
  Field,
  PageHero,
  PrimaryButton,
  Section,
  formatINR,
  inputClass,
} from '../components/PageShell';

const PLANS = [
  {
    key: 'third-party',
    name: 'Third-Party',
    tag: 'Mandatory by law',
    blurb: 'Covers damage or injury you cause to another person, vehicle or property.',
    rateOfIdv: 0.012,
    covers: ['Third-party property damage', 'Third-party injury / death', 'Legally required cover'],
    excludes: ['Damage to your own car', 'Theft of your car'],
  },
  {
    key: 'comprehensive',
    name: 'Comprehensive',
    tag: 'Most popular',
    blurb: 'Third-party cover plus damage to your own car from accident, fire, theft and natural calamity.',
    rateOfIdv: 0.031,
    covers: ['Everything in Third-Party', 'Own-damage from accidents', 'Fire, theft and natural calamity', 'Cashless network garages'],
    excludes: ['Regular wear and tear', 'Driving without a valid licence'],
    highlight: true,
  },
  {
    key: 'zero-dep',
    name: 'Comprehensive + Zero Dep',
    tag: 'Best for cars under 5 yrs',
    blurb: 'Full comprehensive cover with no depreciation deducted on replaced parts at claim time.',
    rateOfIdv: 0.042,
    covers: ['Everything in Comprehensive', 'Zero depreciation on parts', 'Engine protection add-on', 'Roadside assistance'],
    excludes: ['Consumables beyond claim limit'],
  },
];

const WHY = [
  { icon: ShieldCheck, title: 'IRDAI-registered partners', body: 'Quotes sourced only from licensed general insurers.' },
  { icon: Wrench, title: 'Cashless garage network', body: 'Repairs settled directly at partner workshops across India.' },
  { icon: LifeBuoy, title: 'Claim assistance desk', body: 'Our team helps you file and follow up on every claim.' },
  { icon: CarFront, title: 'Inspection-linked pricing', body: 'A verified 4tyrezz inspection score can improve your quote.' },
];

const FAQS = [
  {
    q: 'What is IDV and why does it matter?',
    a: 'Insured Declared Value is the current market value of your car and the maximum amount payable if it is stolen or written off. A higher IDV means a higher premium but a larger payout.',
  },
  {
    q: 'Can I transfer the existing policy when I buy a used car?',
    a: 'Yes. The seller\'s policy can be transferred to your name within 14 days of the ownership transfer. Our desk handles the paperwork with the insurer for cars bought on 4tyrezz.',
  },
  {
    q: 'Does No Claim Bonus carry over?',
    a: 'NCB belongs to the driver, not the car. If you are buying, you can apply your own accumulated NCB to the new policy; sellers can carry theirs to their next vehicle.',
  },
  {
    q: 'Is zero depreciation worth it on a used car?',
    a: 'It is usually worth it for vehicles under five years old, where replacement parts are expensive and depreciation deductions would otherwise be significant.',
  },
];

export default function Insurance() {
  const [idv, setIdv] = useState(500000);
  const [planKey, setPlanKey] = useState('comprehensive');
  const [ncb, setNcb] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', regNumber: '', expiry: '' });
  const [submitting, setSubmitting] = useState(false);
  const { requireAuth } = useAuthGuard();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const plan = PLANS.find((p) => p.key === planKey) || PLANS[1];

  const quote = useMemo(() => {
    const base = idv * plan.rateOfIdv;
    const afterNcb = base * (1 - ncb / 100);
    const gst = afterNcb * 0.18;
    return { base: Math.round(base), discount: Math.round(base - afterNcb), gst: Math.round(gst), total: Math.round(afterNcb + gst) };
  }, [idv, plan, ncb]);

  const submit = () => {
    if (!form.name || !form.phone) {
      toast.error('Name and phone are required');
      return;
    }
    requireAuth(async () => {
      setSubmitting(true);
      try {
        await api.post('/enquiries', {
          type: 'insurance',
          ...form,
          insuranceType: plan.name,
          leadSource: 'insurance_page',
          message: `${plan.name} · IDV ${formatINR(idv)} · NCB ${ncb}% · est. premium ${formatINR(quote.total)}`,
          meta: { plan: plan.key, idv, ncb, estimatedPremium: quote.total },
        });
        toast.success('Insurance enquiry submitted. Our desk will share firm quotes shortly.');
        setForm({ name: '', phone: '', email: '', city: '', regNumber: '', expiry: '' });
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not submit enquiry');
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Car Insurance"
        title="Cover your car in minutes, not days"
        subtitle="Compare third-party, comprehensive and zero-depreciation cover, get an indicative premium instantly, and let our desk fetch firm quotes from IRDAI-registered insurers."
      >
        <div className="flex flex-wrap gap-3 mt-6">
          <a href="#quote">
            <PrimaryButton>Get an instant estimate</PrimaryButton>
          </a>
        </div>
      </PageHero>

      <Section eyebrow="Choose your cover" title="Policy types explained" bg>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => {
            const active = p.key === planKey;
            return (
              <Card
                key={p.key}
                className={`p-6 flex flex-col transition-all cursor-pointer ${
                  active ? 'ring-2 shadow-md' : 'hover:shadow-md'
                }`}
              >
                <button type="button" onClick={() => setPlanKey(p.key)} className="text-left flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md"
                      style={
                        p.highlight
                          ? { backgroundColor: BRAND, color: '#fff' }
                          : { backgroundColor: '#f1f5f9', color: '#475569' }
                      }
                    >
                      {p.tag}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        active ? 'border-transparent' : 'border-slate-300'
                      }`}
                      style={active ? { backgroundColor: BRAND } : undefined}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-lg mt-4">{p.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{p.blurb}</p>

                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-5">What's covered</p>
                  <ul className="mt-2 space-y-1.5">
                    {p.covers.map((c) => (
                      <li key={c} className="flex gap-2 text-xs font-semibold text-slate-600">
                        <BadgeCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: BRAND }} strokeWidth={2.5} />
                        {c}
                      </li>
                    ))}
                  </ul>

                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-4">Not covered</p>
                  <ul className="mt-2 space-y-1.5">
                    {p.excludes.map((c) => (
                      <li key={c} className="flex gap-2 text-xs font-semibold text-slate-400">
                        <span className="mt-0.5 shrink-0">✕</span>
                        {c}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-5 text-xs font-black" style={{ color: BRAND }}>
                    {active ? 'Selected for your quote' : 'Select this plan →'}
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      </Section>

      <div id="quote" className="scroll-mt-24">
        <Section eyebrow="Instant estimate" title="Build your quote">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
            <Card className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Insured Declared Value (IDV)
                  </span>
                  <span className="font-black text-slate-900 text-sm">{formatINR(idv)}</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={5000000}
                  step={25000}
                  value={idv}
                  onChange={(e) => setIdv(Number(e.target.value))}
                  className="w-full accent-[#3083ff] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                  <span>₹1 L</span>
                  <span>₹50 L</span>
                </div>
              </div>

              <Field label="No Claim Bonus" hint="Claim-free years earn a discount on the own-damage premium">
                <select className={inputClass} value={ncb} onChange={(e) => setNcb(Number(e.target.value))}>
                  {[0, 20, 25, 35, 45, 50].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'No NCB (claimed last year)' : `${n}% — ${n === 20 ? '1' : n === 25 ? '2' : n === 35 ? '3' : n === 45 ? '4' : '5+'} claim-free years`}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Selected plan">
                <select className={inputClass} value={planKey} onChange={(e) => setPlanKey(e.target.value)}>
                  {PLANS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </Card>

            <Card className="p-6 flex flex-col">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Estimated annual premium</p>
              <p className="font-black text-slate-900 text-4xl tracking-tight mt-1">{formatINR(quote.total)}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{plan.name} · IDV {formatINR(idv)}</p>

              <div className="mt-6 space-y-3">
                <Row label="Base premium" value={formatINR(quote.base)} />
                <Row label={`NCB discount (${ncb}%)`} value={`− ${formatINR(quote.discount)}`} />
                <Row label="GST @ 18%" value={formatINR(quote.gst)} />
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-sm font-black text-slate-900">Payable</span>
                  <span className="text-sm font-black text-slate-900">{formatINR(quote.total)}</span>
                </div>
              </div>

              <p className="text-[11px] font-semibold text-slate-400 mt-5 leading-relaxed">
                Indicative estimate for comparison only. Firm premiums depend on the insurer, your car's make, model,
                age, RTO location and claim history.
              </p>
            </Card>
          </div>
        </Section>
      </div>

      <Section eyebrow="Firm quotes" title="Get quotes from our insurance desk" bg>
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <Card className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name">
                <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Mobile number">
                <input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" />
              </Field>
              <Field label="Email">
                <input className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
              </Field>
              <Field label="City">
                <input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Hyderabad" />
              </Field>
              <Field label="Registration number" hint="Optional — speeds up the quote">
                <input className={inputClass} value={form.regNumber} onChange={(e) => set('regNumber', e.target.value)} placeholder="TS09AB1234" />
              </Field>
              <Field label="Current policy expiry" hint="Optional">
                <input type="date" className={inputClass} value={form.expiry} onChange={(e) => set('expiry', e.target.value)} />
              </Field>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Your estimate</p>
              <p className="text-sm font-extrabold text-slate-800 mt-1">
                {plan.name} · IDV {formatINR(idv)} · NCB {ncb}% · ~{formatINR(quote.total)}/year
              </p>
            </div>

            <PrimaryButton className="w-full mt-5" disabled={submitting} onClick={submit}>
              {submitting ? 'Submitting…' : 'Get insurance quote'}
            </PrimaryButton>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {WHY.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{title}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{body}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow="Help Center" title="Insurance questions, answered">
        <div className="max-w-3xl space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="bg-white border border-slate-200 rounded-xl p-5 group cursor-pointer shadow-xs"
            >
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
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
