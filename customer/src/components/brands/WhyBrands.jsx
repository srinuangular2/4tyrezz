import { Link } from 'react-router-dom';
import { Car, GitCompare, HandCoins, Search } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Choose a brand',
    body: 'Start with the make you know — Maruti, Hyundai, Honda, Tata, Mahindra and others. Search if the list is long.',
  },
  {
    icon: Car,
    title: 'Browse live cars',
    body: 'You land on listings for that brand only. Filter by year, fuel, budget and city to shortlist faster.',
  },
  {
    icon: GitCompare,
    title: 'Open a car or compare',
    body: 'See photos, kilometres, price and inspection details. Use Compare if you are deciding between two models.',
  },
  {
    icon: HandCoins,
    title: 'Buy, finance, or sell yours',
    body: 'Talk to 4tyrezz about a listing. Need money? Check EMI. Selling? Use Car Valuation, then Sell my car.',
  },
];

export default function WhyBrands() {
  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
      <div>
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
          How 4tyrezz works
        </span>
        <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display text-slate-800">
          One app to <span className="font-black text-slate-900">buy and sell</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-3 max-w-lg leading-relaxed">
          4tyrezz is a used-car marketplace. Brands help you start. We inspect cars, keep your number private, and help with price, finance and paperwork.
        </p>

        <ol className="mt-8 space-y-5">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4">
              <div className="relative shrink-0">
                <span className="w-12 h-12 rounded-2xl bg-[#3083ff]/10 border border-[#3083ff]/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#3083ff]" strokeWidth={2.25} />
                </span>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3083ff] text-white text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div className="pt-0.5">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/cars"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3083ff] text-white text-xs font-black uppercase tracking-wide hover:bg-[#1853ff] transition-colors"
          >
            Browse all cars
          </Link>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-wide hover:bg-slate-800 transition-colors"
          >
            Sell your car
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-3 rounded-[2rem] bg-[#3083ff]/10 blur-xl" aria-hidden />
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.12)] aspect-[16/9] lg:aspect-[5/3]">
          <img
            src="/car-brands.png"
            alt="Used cars from popular brands on 4tyrezz"
            className="w-full h-full object-cover object-[70%_center]"
          />
        </div>
      </div>
    </div>
  );
}
