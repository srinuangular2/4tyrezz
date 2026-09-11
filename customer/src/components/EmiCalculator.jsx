import { useMemo, useState } from 'react';
import { formatPrice } from '../utils/format';

// Standard reducing-balance EMI calculator. Rate is a fixed indicative
// figure (not tied to any real lender) — same disclaimer pattern banks and
// marketplaces universally show next to these widgets.
const ANNUAL_RATE = 10.5; // %, indicative only

function calcEmi(principal, annualRatePct, months) {
  if (!principal || !months) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export default function EmiCalculator({ price, onContactSeller }) {
  const [downPayment, setDownPayment] = useState(Math.round(price * 0.2));
  const [months, setMonths] = useState(60);

  const loanAmount = Math.max(price - downPayment, 0);
  const maxDownPayment = price;

  const { emi, totalPayable, totalInterest } = useMemo(() => {
    const monthlyEmi = calcEmi(loanAmount, ANNUAL_RATE, months);
    const payable = monthlyEmi * months;
    return {
      emi: Math.round(monthlyEmi),
      totalPayable: Math.round(payable),
      totalInterest: Math.round(payable - loanAmount),
    };
  }, [loanAmount, months]);

  const interestShare = totalPayable > 0 ? totalInterest / totalPayable : 0;
  const circumference = 2 * Math.PI * 54;
  const interestDash = circumference * interestShare;

  return (
    <section className="mt-14">
      <h3 className="font-display font-semibold text-2xl mb-1">EMI calculator</h3>
      <p className="text-sm text-slate2 mb-6">Estimate your monthly payment — actual rate depends on your credit profile and lender.</p>

      <div className="grid md:grid-cols-[1fr_1.3fr] gap-8 bg-white border border-slate-100 rounded-2xl p-6">
        {/* ---- Result + donut ---- */}
        <div>
          <p className="text-xs font-semibold text-slate2 uppercase tracking-wide">EMI starting from</p>
          <p className="font-display font-semibold text-4xl mt-1">
            {formatPrice(emi).replace('₹', '')}
            <span className="text-base font-body font-normal text-slate2 ml-1">/month</span>
          </p>

          <div className="relative w-40 h-40 mx-auto md:mx-0 mt-6">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="#1C1C1E" strokeWidth="12"
                strokeDasharray={`${circumference - interestDash} ${circumference}`}
              />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="#3083ff" strokeWidth="12"
                strokeDasharray={`${interestDash} ${circumference}`}
                strokeDashoffset={-(circumference - interestDash)}
              />
            </svg>
          </div>

          <div className="space-y-2 mt-5 text-sm">
            <LegendRow color="#1C1C1E" label="Principal loan amount" value={formatPrice(loanAmount)} />
            <LegendRow color="#3083ff" label="Total interest payable" value={formatPrice(totalInterest)} />
            <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold">
              <span>Total amount payable</span>
              <span>{formatPrice(totalPayable)}</span>
            </div>
          </div>
        </div>

        {/* ---- Sliders ---- */}
        <div className="space-y-6">
          <SliderRow
            label="Loan amount" value={formatPrice(loanAmount)}
            min={0} max={price} step={5000}
            sliderValue={loanAmount}
            onChange={(v) => setDownPayment(price - v)}
            minLabel="₹0" maxLabel={formatPrice(price)}
          />
          <SliderRow
            label="Down payment" value={formatPrice(downPayment)}
            min={0} max={maxDownPayment} step={5000}
            sliderValue={downPayment}
            onChange={(v) => setDownPayment(v)}
            minLabel="₹0" maxLabel={formatPrice(maxDownPayment)}
          />
          <SliderRow
            label="Duration of loan" value={`${months} months`}
            min={12} max={84} step={6}
            sliderValue={months}
            onChange={(v) => setMonths(v)}
            minLabel="12 months" maxLabel="84 months"
          />

          <button
            type="button"
            onClick={onContactSeller}
            className="w-full bg-ink hover:bg-ink-2 text-white font-semibold py-3 rounded-lg transition"
          >
            Talk to the seller about financing
          </button>
          <p className="text-xs text-slate2">
            *Indicative rate of {ANNUAL_RATE}% p.a. Actual interest rate, processing fees, and eligibility
            depend on your credit profile and the financing partner — this is an estimate, not an offer.
          </p>
        </div>
      </div>
    </section>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-2 text-slate2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, sliderValue, onChange, minLabel, maxLabel }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-semibold">{label}</label>
        <span className="font-display font-semibold text-ember">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={sliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ember"
      />
      <div className="flex justify-between text-xs text-slate2 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
