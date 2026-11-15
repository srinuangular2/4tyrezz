import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BadgeCheck, CarFront, ClipboardCheck, Megaphone, ShieldCheck, Store, Upload, Users } from 'lucide-react';
import { dealerLogin, fetchMe } from '../app/authSlice';
import PasswordField from '../components/PasswordField';
import { inputClass } from '../lib/kycValidation';

const BENEFITS = [
  { icon: Users, title: 'Reach buyers already looking', body: 'Approved cars show on the 4tyrezz buy page, next to inspected stock.' },
  { icon: BadgeCheck, title: 'A verified showroom', body: 'KYC is checked before inventory opens, so buyers know the dealer is real.' },
  { icon: ShieldCheck, title: 'Listings are reviewed', body: 'You add the car. 4tyrezz admin approves it before a buyer can see it.' },
  { icon: Store, title: 'One Dealer ID', body: 'Sign in with the ID issued by 4tyrezz. There is no public self-signup.' },
];

const STEPS = [
  { n: '1', title: 'Get your Dealer ID', body: '4tyrezz admin creates the ID and shares the password with the showroom.' },
  { n: '2', title: 'Complete KYC', body: 'Add the showroom papers. Inventory stays locked until KYC is approved.' },
  { n: '3', title: 'Add your cars', body: 'Enter one vehicle or upload a batch. Photos, price, and papers go with the listing.' },
  { n: '4', title: 'Go live after approval', body: 'Admin clears the car. Buyers then see it and contact 4tyrezz to proceed.' },
];

const USES = [
  { icon: CarFront, title: 'Inventory', body: 'See every car you have listed, and update price, photos, or status.' },
  { icon: Upload, title: 'Add or bulk upload', body: 'List a single car, or upload many when a new lot arrives.' },
  { icon: Megaphone, title: 'Promotions', body: 'Ask for a featured spot so a car stands out on the buy page.' },
  { icon: ClipboardCheck, title: 'Showroom profile', body: 'Keep the dealership name, contact, and KYC details up to date.' },
];

function formatDealerId(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '');
}

export default function DealerLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ dealerCode: '', password: '' });
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const dealerCode = formatDealerId(form.dealerCode);
    if (!dealerCode) {
      setFieldError('Dealer ID is required');
      return;
    }
    if (!form.password) {
      setFieldError('Password is required');
      return;
    }
    setLoading(true);
    const res = await dispatch(dealerLogin({
      dealerCode,
      password: form.password,
    }));
    setLoading(false);
    if (res.meta.requestStatus === 'fulfilled') {
      await dispatch(fetchMe());
      const verified = res.payload?.user?.kycVerified;
      navigate(verified ? '/dealer/dashboard/inventory' : '/dealer/dashboard/onboarding');
    }
  };

  return (
    <div className="bg-[#f4f7fb]">
      <section className="bg-[#3083ff] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-5 px-4 py-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:px-8 lg:py-14">
          <div className="order-2 lg:order-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">Dealer home</p>
            <h1 className="mt-2 max-w-xl text-[26px] font-semibold leading-tight sm:text-[34px]">List your showroom stock on 4tyrezz</h1>
            <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/90 sm:text-[15px]">
              Dealers use one ID to complete KYC, add cars, and publish them after admin approval. Buyers see only cleared listings.
            </p>
            <ul className="mt-5 hidden space-y-2 text-[13px] text-white/95 lg:block">
              {['Verified showroom before any car goes live', 'Add one car or upload a full lot', 'Buyers contact 4tyrezz, not a random number'].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div id="dealer-signin" className="order-1 rounded-3xl bg-white p-4 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.16)] sm:p-6 lg:order-2">
        <h2 className="text-[20px] font-semibold text-slate-900">Sign in with your Dealer ID</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Use the ID issued by 4tyrezz. Complete KYC, then add cars for admin approval.
        </p>
        <form onSubmit={submit} autoComplete="off" className="mt-5 space-y-3">
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Dealer ID</span>
            <input
              required
              type="text"
              autoComplete="username"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={form.dealerCode}
              onChange={(e) => {
                setForm({ ...form, dealerCode: formatDealerId(e.target.value) });
                setFieldError('');
              }}
              placeholder="4T-2026-52613"
              className={`${inputClass} mt-1.5 uppercase tracking-wide`}
            />
          </label>
          <PasswordField
            required
            label="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              setFieldError('');
            }}
          />
          {(fieldError || error) && <p className="text-sm font-semibold text-rose-600">{fieldError || error}</p>}
          <button
            disabled={loading}
            className="w-full bg-[#3083ff] hover:bg-[#1853ff] text-white font-semibold py-3.5 rounded-2xl"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm font-semibold text-slate-500 text-center mt-6">
          Need an account? Ask 4tyrezz admin to create your Dealer ID.
        </p>
        <p className="mt-2 text-center text-[13px] font-medium text-slate-500">
          Already signed in?{' '}
          <Link to="/dealer/dashboard/onboarding" className="font-semibold text-[#3083ff]">
            Continue KYC
          </Link>
        </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
        <h2 className="text-[20px] font-semibold text-slate-900">Why join 4tyrezz</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">A showroom listing is useful when buyers can trust who is selling and the car has been cleared.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#3083ff]">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
          <h2 className="text-[20px] font-semibold text-slate-900">How a dealer gets live</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <article key={step.n} className="rounded-2xl border border-slate-200 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3083ff] text-[13px] font-semibold text-white">{step.n}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
        <h2 className="text-[20px] font-semibold text-slate-900">What you use after sign-in</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {USES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#3083ff]">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
