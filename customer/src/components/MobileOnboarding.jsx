import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SEEN_KEY = '4tyrezz:onboarding-seen';

const SLIDES = [
  {
    title: 'Discover your next inspected car',
    body: 'Browse certified used cars with a clear price, kilometres, and an EMI before you visit.',
    screen: 'list',
  },
  {
    title: 'Check a car before you pay',
    body: 'Book a 300-point inspection and get the report in about 60 minutes.',
    screen: 'detail',
  },
  {
    title: 'Get exclusive offers and finance',
    body: 'See live offers, EMI plans, and insurance on cars that are already inspected.',
    screen: 'offers',
    cta: "Let's Get Started",
  },
];

function Phone({ children }) {
  return (
    <div className="w-[180px] h-[286px] rounded-[28px] bg-[#0c2e68] p-[6px] shadow-[0_18px_40px_rgba(7,24,51,0.28)]">
      <div className="relative h-full rounded-[22px] bg-white overflow-hidden">
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-[#0c2e68] rounded-b-xl z-10" />
        {children}
      </div>
    </div>
  );
}

function ListScreen() {
  const rows = [
    { title: 'Certified sedan', meta: 'Petrol · Automatic', price: '₹8.4 Lakh', image: '/used-cars.png' },
    { title: 'Family SUV', meta: 'Diesel · Manual', price: '₹12.6 Lakh', image: '/sell-my-car.png' },
  ];
  return (
    <div className="h-full bg-white pt-5 flex flex-col">
      <p className="text-[11px] font-black text-slate-900 text-center">Cars available</p>
      <div className="flex gap-1 px-2 mt-2">
        {['All', 'Hatch', 'Sedan', 'SUV'].map((chip, index) => (
          <span
            key={chip}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${index === 0 ? 'bg-[#3083ff] text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-2 px-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.title} className="flex gap-2 items-center rounded-xl border border-slate-100 p-1.5">
            <img src={row.image} alt="" className="w-14 h-10 rounded-lg object-cover object-right bg-slate-100" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black text-slate-900 truncate">{row.title}</p>
              <p className="text-[8px] font-semibold text-slate-500">{row.meta}</p>
              <p className="text-[9px] font-black text-[#3083ff]">{row.price}</p>
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
      <p className="text-[11px] font-black text-slate-900 text-center">Car details</p>
      <div className="mx-3 mt-2 h-[92px] rounded-2xl overflow-hidden bg-slate-100">
        <img src="/used-cars.png" alt="" className="w-full h-full object-cover object-right" />
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
      <p className="text-[11px] font-black text-slate-900 text-center">Offers</p>
      <div className="mx-3 mt-2 h-7 rounded-full border border-slate-200 px-2 flex items-center text-[8px] font-semibold text-slate-400">
        Have a promo code?
      </div>
      <div className="mx-3 mt-2 h-[108px] rounded-xl overflow-hidden">
        <img src="/offers.png" alt="" className="w-full h-full object-cover object-right" />
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
    <div className="fixed inset-0 z-[80] lg:hidden bg-white flex flex-col overflow-hidden">
      <div className="relative bg-[#3083ff] h-[52%] min-h-[250px] flex items-end justify-center overflow-hidden">
        <div className="absolute inset-x-0 -bottom-px h-12 bg-white rounded-t-[40px]" />
        <div className="relative z-10 mb-1">
          <Phone>
            <Screen />
          </Phone>
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h1 className="text-[20px] font-black text-slate-900 text-center leading-snug break-words">{slide.title}</h1>
        <p className="mt-2 text-[13px] font-medium text-slate-500 text-center leading-relaxed break-words">{slide.body}</p>
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {SLIDES.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 rounded-full transition-all ${index === step - 1 ? 'w-5 bg-[#3083ff]' : 'w-1.5 bg-slate-300'}`}
            />
          ))}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={finish}
            className="h-12 w-full rounded-full border-2 border-[#3083ff] text-[#3083ff] text-sm font-black"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (step === SLIDES.length ? finish() : setStep(step + 1))}
            className="h-12 w-full rounded-full bg-[#3083ff] text-white text-sm font-black"
          >
            {slide.cta || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
