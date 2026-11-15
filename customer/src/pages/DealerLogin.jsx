import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  BadgeCheck,
  Banknote,
  Building2,
  CarFront,
  Check,
  ClipboardCheck,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Star,
  Store,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import { dealerLogin, fetchMe } from '../app/authSlice';
import PasswordField from '../components/PasswordField';
import { inputClass } from '../lib/kycValidation';

const STRIPES = {
  backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.08) 22px 44px)',
};

const POINTS = [
  'Verified showroom before any car goes live',
  'Add one car or upload a full lot',
  'Buyers contact 4tyrezz, not a random number',
];

const METRICS = [
  { value: '500+', label: 'Verified dealers', icon: Store, chip: 'bg-white text-[#1853ff]' },
  { value: '₹50Cr+', label: 'Monthly inventory', icon: Banknote, chip: 'bg-[#ffe09a] text-[#9a6700]' },
  { value: '98%', label: 'Lead conversion', icon: BadgeCheck, chip: 'bg-[#b4e8d0] text-[#0f7a45]' },
];

const BENEFITS = [
  { icon: MapPin, tone: 'from-[#7eb6f5] to-[#d7ebff]', mark: 'bg-[#1853ff]', title: 'Pan-India buyer reach', body: 'Your stock sits in front of buyers already searching in your city.' },
  { icon: ClipboardCheck, tone: 'from-[#7ddeb4] to-[#d8f5e8]', mark: 'bg-[#0f7a45]', title: 'Inspection trust', body: 'An official 4tyrezz inspection badge helps a buyer decide faster.' },
  { icon: Wallet, tone: 'from-[#ffd56a] to-[#fff0c8]', mark: 'bg-[#9a6700]', title: 'Finance and booking', body: 'Buyers can ask for a loan and pay a booking token on the listing.' },
  { icon: LayoutDashboard, tone: 'from-[#c4a6f5] to-[#eee4fc]', mark: 'bg-[#6d28d9]', title: 'Showroom dashboard', body: 'Update price, photos, and stock from your phone or a desktop.' },
  { icon: Users, tone: 'from-[#8fd4f5] to-[#e5f7ff]', mark: 'bg-[#0e7490]', title: 'One Dealer ID', body: '4tyrezz issues the ID. Sign in, finish KYC, then add cars.' },
  { icon: MessageCircle, tone: 'from-[#fda4af] to-[#ffe4e8]', mark: 'bg-[#be123c]', title: 'Lead alerts', body: 'See buyer interest as soon as someone asks about a live car.' },
];

const STEPS = [
  { n: '01', icon: Building2, panel: 'bg-[#061a4a]', title: 'Get your Dealer ID', body: '4tyrezz creates the ID and shares it with the showroom.' },
  { n: '02', icon: ShieldCheck, panel: 'bg-[#3083ff]', title: 'Complete KYC', body: 'Add the showroom papers. Stock stays locked until KYC is approved.' },
  { n: '03', icon: Upload, panel: 'bg-[#0f7a45]', title: 'Add your cars', body: 'List one vehicle or upload a lot, with photos and a clear price.' },
];

const USES = [
  { icon: CarFront, bar: 'bg-[#3083ff]', title: 'Inventory', body: 'Every listed car, with price, photos, and status.' },
  { icon: Upload, bar: 'bg-[#0f7a45]', title: 'Add or bulk upload', body: 'One car at a time, or a full lot when stock arrives.' },
  { icon: Megaphone, bar: 'bg-[#d97706]', title: 'Promotions', body: 'Ask for a featured spot on the buy page.' },
  { icon: ClipboardCheck, bar: 'bg-[#7c3aed]', title: 'Showroom profile', body: 'Name, contact, and KYC stay in one place.' },
];

const STORIES = [
  {
    initials: 'RK',
    panel: 'bg-gradient-to-br from-[#fff4d6] to-[#fffaf0]',
    avatar: 'bg-[#9a6700]',
    quote: 'Partnering with 4TYREZZ doubled our monthly turnover within 90 days. The verified lead quality and instant inspection reports make closing deals effortless.',
    name: 'Ramesh Kumar',
    role: 'Managing Director, Apex Motors, Hyderabad',
  },
  {
    initials: 'SR',
    panel: 'bg-gradient-to-br from-[#efe4ff] to-[#f7f2ff]',
    avatar: 'bg-[#6d28d9]',
    quote: 'The dashboard lets my sales team manage bookings and token advances without tracking them on paper.',
    name: 'Suresh Reddy',
    role: 'Owner, Sri Car Bazaar',
  },
];

function formatDealerId(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '');
}

function Stars() {
  return (
    <span className="flex gap-0.5 text-amber-400" aria-label="5 star rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
      ))}
    </span>
  );
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
      navigate('/dealer/dashboard');
    }
  };

  return (
    <div className="bg-[#f4f7fb] pb-10">
      <section className="relative overflow-hidden bg-[#3083ff] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={STRIPES} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-5 px-4 py-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:px-8 lg:py-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-medium text-white">
              <Rocket className="h-3.5 w-3.5" />
              Powered by 4TYREZZ Dealer Network
            </p>
            <h1 className="mt-3 max-w-xl text-[22px] font-semibold leading-tight sm:text-[32px] lg:text-[40px]">
              List your showroom stock with verified leads.
            </h1>
            <p className="mt-2 hidden max-w-lg text-[14px] font-normal leading-relaxed text-white/90 lg:block">
              One Dealer ID for KYC, inventory, and approvals. Buyers only see cars that 4tyrezz has cleared.
            </p>
            <ul className="mt-3 space-y-1.5 lg:mt-5 lg:space-y-2.5">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-1.5 text-[12px] font-medium text-white/95 lg:text-[14px]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" strokeWidth={2.5} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 lg:mt-6 lg:max-w-lg">
              {METRICS.map(({ value, label, icon: Icon, chip }) => (
                <div key={label} className={`rounded-2xl px-2 py-2.5 text-center lg:px-3 lg:py-3.5 ${chip}`}>
                  <Icon className="mx-auto h-4 w-4" strokeWidth={2} />
                  <p className="mt-1 text-[16px] font-semibold leading-none lg:text-[22px]">{value}</p>
                  <p className="mt-1 text-[10px] font-medium leading-tight opacity-80 lg:text-[12px]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="dealer-signin" className="rounded-[28px] bg-white p-5 text-slate-900 shadow-[0_18px_50px_rgba(6,26,74,0.28)] sm:p-7">
            <p className="text-[12px] font-medium text-[#1853ff]">Dealer sign in</p>
            <h2 className="mt-1 text-[22px] font-medium text-slate-900">Use your Dealer ID</h2>
            <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-slate-500">
              The ID is issued by 4tyrezz. After sign-in you complete KYC, then add cars for approval.
            </p>
            <form onSubmit={submit} autoComplete="off" className="mt-5 space-y-3">
              <label className="block">
                <span className="text-[13px] font-medium text-slate-600">Dealer ID</span>
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
              {(fieldError || error) && <p className="text-sm font-medium text-rose-600">{fieldError || error}</p>}
              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#3083ff] py-3.5 text-[15px] font-medium text-white hover:bg-[#1853ff] disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="mt-5 text-center text-[13px] font-normal text-slate-500">
              Need an account? Ask 4tyrezz admin for a Dealer ID.
            </p>
            <p className="mt-1 text-center text-[13px] font-normal text-slate-500">
              Already signed in?{' '}
              <Link to="/dealer/dashboard/onboarding" className="font-medium text-[#1853ff]">Continue KYC</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-6xl px-4 lg:mt-8 lg:px-8">
        <p className="text-[12px] font-medium text-[#1853ff]">Why dealers join</p>
        <h2 className="mt-1 text-[20px] font-medium text-slate-900 sm:text-[26px]">Built for a modern showroom</h2>
        <p className="mt-1 max-w-2xl text-[13px] font-normal leading-relaxed text-slate-500">Everything you use to stock, show, and sell faster.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {BENEFITS.map(({ icon: Icon, tone, mark, title, body }) => (
            <article key={title} className={`overflow-hidden rounded-[22px] bg-gradient-to-br ${tone} p-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] lg:p-5`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${mark}`}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-3 text-[14px] font-medium leading-snug text-slate-900 lg:text-[16px]">{title}</h3>
              <p className="mt-1.5 text-[12px] font-normal leading-relaxed text-slate-700 lg:text-[13px]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-6xl px-4 lg:mt-8 lg:px-8">
        <h2 className="text-[20px] font-medium text-slate-900 sm:text-[26px]">How a dealer gets live</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3 lg:gap-4">
          {STEPS.map(({ n, icon: Icon, panel, title, body }) => (
            <article key={n} className={`relative overflow-hidden rounded-[22px] p-4 text-white lg:min-h-[190px] lg:p-5 ${panel}`}>
              <span className="absolute -right-1 -top-3 text-[64px] font-semibold leading-none text-white/15">{n}</span>
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="relative mt-4 text-[16px] font-medium">{title}</h3>
              <p className="relative mt-1.5 text-[13px] font-normal leading-relaxed text-white/85">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-6xl px-4 lg:mt-8 lg:px-8">
        <div className="rounded-[28px] bg-[#061a4a] px-4 py-5 text-white lg:px-6 lg:py-7">
          <h2 className="text-[20px] font-medium sm:text-[26px]">What you use after sign-in</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
            {USES.map(({ icon: Icon, bar, title, body }) => (
              <article key={title} className="flex gap-3 rounded-2xl bg-white/10 p-3 lg:block lg:p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${bar}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">{title}</span>
                  <span className="mt-0.5 block text-[12px] font-normal leading-relaxed text-white/70 lg:mt-2 lg:text-[13px]">{body}</span>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-6xl px-4 lg:mt-8 lg:px-8">
        <h2 className="text-[20px] font-medium text-slate-900 sm:text-[26px]">Showrooms already on 4tyrezz</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2 lg:gap-4">
          {STORIES.map((story) => (
            <article key={story.name} className={`rounded-[22px] p-4 lg:p-6 ${story.panel}`}>
              <div className="flex items-center justify-between gap-3">
                <Stars />
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <Store className="h-3.5 w-3.5" />
                  Verified showroom
                </span>
              </div>
              <p className="mt-3 text-[14px] font-normal leading-relaxed text-slate-800">“{story.quote}”</p>
              <div className="mt-4 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-medium text-white ${story.avatar}`}>{story.initials}</span>
                <span>
                  <span className="flex items-center gap-1.5 text-[14px] font-medium text-slate-900">
                    {story.name}
                    <BadgeCheck className="h-4 w-4 text-[#3083ff]" />
                  </span>
                  <span className="block text-[12px] font-normal text-slate-600">{story.role}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
