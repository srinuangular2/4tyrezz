import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SEEN_KEY = '4tyrezz:onboarding-seen';

const SLIDES = [
  {
    kicker: 'Browse',
    title: 'Find a car with a clear price',
    body: 'See kilometres, fuel and the monthly EMI before you visit.',
    screen: 'list',
  },
  {
    kicker: 'Inspect',
    title: 'Check the car before you pay',
    body: 'Book a 300-point inspection. The report is ready in about 60 minutes.',
    screen: 'detail',
  },
  {
    kicker: 'Decide',
    title: 'Then finance or take an offer',
    body: 'EMI, insurance and offers are on cars we have already inspected.',
    screen: 'offers',
    cta: 'Get started',
  },
];

function Phone({ children }) {
  return (
    <div className="h-[372px] w-[252px] rounded-[34px] bg-[#0c2e68] p-[7px] shadow-[0_22px_48px_rgba(7,24,51,0.35)]">
      <div className="relative h-full overflow-hidden rounded-[26px] bg-white">
        <span className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-[#0c2e68]" />
        {children}
      </div>
    </div>
  );
}

function ListScreen() {
  const rows = [
    { title: 'Certified sedan', meta: 'Petrol · Automatic', price: '₹8.4 Lakh', image: '/onboarding/browse-sedan.jpg' },
    { title: 'Family SUV', meta: 'Diesel · Manual', price: '₹12.6 Lakh', image: '/onboarding/browse-suv.jpg' },
  ];
  return (
    <div className="flex h-full flex-col bg-white px-2.5 pt-7">
      <p className="text-center text-[13px] font-bold text-slate-900">1 · Browse</p>
      <div className="mt-2.5 flex gap-1">
        {['All', 'Hatch', 'Sedan', 'SUV'].map((chip, index) => (
          <span
            key={chip}
            className={`rounded-full px-2 py-1 text-[8px] font-semibold ${index === 0 ? 'bg-[#3083ff] text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-2.5 space-y-2">
        {rows.map((row) => (
          <div key={row.title} className="flex items-center gap-2 rounded-2xl border border-slate-200 p-1.5">
            <img src={row.image} alt="" className="h-[70px] w-[94px] shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold leading-tight text-slate-900">{row.title}</p>
              <p className="mt-0.5 truncate text-[9px] text-slate-500">{row.meta}</p>
              <p className="mt-1 text-[11px] font-bold text-[#3083ff]">{row.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailScreen() {
  return (
    <div className="h-full bg-white pt-5 flex flex-col">
      <p className="text-[11px] font-semibold text-slate-900 text-center">2 · Inspect</p>
      <div className="mx-3 mt-3 h-[150px] overflow-hidden rounded-2xl bg-slate-100">
        <img src="/onboarding/browse-sedan.jpg" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="px-3 mt-2">
        <p className="text-[11px] font-black text-slate-900">Certified sedan</p>
        <p className="text-[10px] font-black text-[#3083ff] mt-0.5">₹8.4 Lakh</p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {['Petrol', 'Auto', '1 owner'].map((item) => (
            <span key={item} className="text-[8px] font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg py-1 text-center">
              {item}
            </span>
          ))}
        </div>
        <span className="mt-2 inline-flex text-[8px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
          4TYREZZ inspected
        </span>
      </div>
    </div>
  );
}

function OffersScreen() {
  return (
    <div className="h-full bg-white pt-5 flex flex-col">
      <p className="text-[11px] font-semibold text-slate-900 text-center">3 · Decide</p>
      <div className="mx-3 mt-2 h-7 rounded-full border border-slate-200 px-2 flex items-center text-[8px] font-semibold text-slate-400">
        Have a promo code?
      </div>
      <div className="mx-3 mt-3 h-[150px] overflow-hidden rounded-xl">
        <img src="/onboarding/decide.jpg" alt="" className="h-full w-full object-cover object-[center_42%]" />
      </div>
      <p className="px-3 mt-2 text-[9px] font-black text-slate-900">Best deals on inspected cars</p>
      <p className="px-3 text-[8px] font-semibold text-slate-500">EMI from 8.5% · Insurance renewal</p>
    </div>
  );
}

const SCREENS = { list: ListScreen, detail: DetailScreen, offers: OffersScreen };

export default function MobileOnboarding() {
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(false);
  const [step, setStep] = useState(() => (localStorage.getItem(SEEN_KEY) ? -1 : 0));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const apply = () => setMobile(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!mobile || step !== 0) return undefined;
    const timer = setTimeout(() => setStep(1), 1700);
    return () => clearTimeout(timer);
  }, [mobile, step]);

  const finish = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setStep(-1);
  };

  if (!mobile || step < 0 || pathname.startsWith('/dealer')) return null;

  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[80] lg:hidden bg-[#3083ff] flex flex-col items-center justify-center text-white">
        <img src="/blue-logo.png" alt="4TYREZZ" className="h-16 w-auto brightness-0 invert" />
        <p className="mt-3 text-sm font-black tracking-[0.28em]">4TYREZZ</p>
        <span className="mt-12 w-10 h-10 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  const slide = SLIDES[step - 1];
  const Screen = SCREENS[slide.screen];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#3083ff] lg:hidden">
      <div className="relative z-20 flex min-h-0 flex-1 items-end justify-center px-6 pt-[max(12px,env(safe-area-inset-top))]">
        <Phone>
          <Screen />
        </Phone>
      </div>

      <div className="relative z-10 -mt-8 w-full shrink-0">
        <svg
          viewBox="0 0 390 56"
          preserveAspectRatio="none"
          className="block h-14 w-full text-white"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M0 56Q195 0 390 56V56H0Z" />
        </svg>
        <div className="flex w-full min-w-0 flex-col bg-white px-5 pb-[max(1.15rem,env(safe-area-inset-bottom))] pt-1">
          <h1 className="min-w-0 text-balance text-center text-[24px] font-bold leading-tight text-slate-900">{slide.title}</h1>
          <p className="mx-auto mt-2 min-w-0 max-w-[320px] text-balance text-center text-[13px] font-normal leading-relaxed text-slate-500">{slide.body}</p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {SLIDES.map((item, index) => (
              <span
                key={item.kicker}
                className={`h-1.5 rounded-full transition-all ${index === step - 1 ? 'w-6 bg-[#3083ff]' : 'w-1.5 bg-slate-300'}`}
              />
            ))}
          </div>
          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={finish}
              className="h-[52px] w-full rounded-full bg-[#e8f1ff] text-[15px] font-semibold text-[#3083ff]"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => (step === SLIDES.length ? finish() : setStep(step + 1))}
              className="h-[52px] w-full rounded-full bg-[#3083ff] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgba(48,131,255,0.28)]"
            >
              {slide.cta || 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
