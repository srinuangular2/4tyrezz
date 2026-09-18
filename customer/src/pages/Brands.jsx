import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Car } from 'lucide-react';
import useReferenceData from '../hooks/useReferenceData';
import { mediaUrl } from './profile/hubUtils';
import { EmptyState, Section, Skeleton } from '../components/PageShell';
import BrandsBanner from '../components/brands/BrandsBanner';
import WhyBrands from '../components/brands/WhyBrands';
import FaqsSection from '../components/FaqsSection';

const BRAND_FAQS = [
  {
    q: 'What is 4tyrezz?',
    a: '4tyrezz is a used-car marketplace. You can buy inspected cars, check a fair price, sell your car, compare models, and apply for finance — without sharing your number with random callers.',
  },
  {
    q: 'How do I use the All Brands page?',
    a: 'Search or tap a logo. You will see only that manufacturer’s live listings. From there open a car for photos, kilometres, price and next steps.',
  },
  {
    q: 'Are these new cars?',
    a: 'No. 4tyrezz lists pre-owned cars. Brand pages help you stay with a make you already trust, such as Maruti or Hyundai.',
  },
  {
    q: 'How do I buy a car after I pick a brand?',
    a: 'Open a listing, check details, then contact 4tyrezz. You can also compare two cars or check EMI on Finance before you decide.',
  },
  {
    q: 'I want to sell, not buy. Is this page still useful?',
    a: 'Yes. Seeing what your brand sells for helps. Then use Car Valuation for an estimate and Sell my car to book inspection.',
  },
  {
    q: 'Why should I buy or sell with 4tyrezz?',
    a: 'Listings are reviewed, valuation uses the same catalogue as Sell, and our team handles follow-up. You talk to 4tyrezz, not a public phone board.',
  },
];

export default function Brands() {
  const { brands, loading } = useReferenceData();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...(brands || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (!q) return list;
    return list.filter((b) => String(b.name || '').toLowerCase().includes(q));
  }, [brands, query]);

  return (
    <div className="bg-slate-50">
      <BrandsBanner>
        <div className="mt-8 max-w-md">
          <label className="sr-only" htmlFor="brand-search">Search brand</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
            <input
              id="brand-search"
              className="w-full bg-white rounded-full pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 shadow-xl border border-white/80 outline-none focus:ring-2 focus:ring-[#3083ff]/40"
              placeholder="Search Maruti, Hyundai, Honda…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query.trim() && visible.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {visible.slice(0, 6).map((b) => (
                <Link
                  key={b._id}
                  to={`/cars?brand=${b._id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-[#3083ff] hover:text-white transition-colors shadow-sm"
                >
                  {b.logo ? (
                    <img src={mediaUrl(b.logo)} alt="" className="w-4 h-4 object-contain" />
                  ) : null}
                  {b.name}
                </Link>
              ))}
              {visible.length > 6 && (
                <span className="inline-flex items-center text-[11px] font-bold text-white/80 px-1">
                  +{visible.length - 6} more below
                </span>
              )}
            </div>
          )}
        </div>
      </BrandsBanner>

      <Section eyebrow="Browse" title="Tap a brand to see cars">
        <p className="text-slate-500 text-sm font-medium -mt-2 mb-6 max-w-2xl">
          {brands.length
            ? `${brands.length} makes on 4tyrezz. Pick one to open live used cars for that brand.`
            : 'Manufacturers appear here as inventory is added.'}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visible.map((b) => (
              <Link
                key={b._id}
                to={`/cars?brand=${b._id}`}
                className="group relative flex flex-col items-center justify-center gap-3 p-5 h-32 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_16px_32px_0_rgba(37,99,235,0.18)] hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="h-10 w-full flex items-center justify-center">
                  {b.logo ? (
                    <img
                      src={mediaUrl(b.logo)}
                      alt={b.name}
                      className="max-h-10 max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-slate-900/5 border border-slate-900/10 flex items-center justify-center text-xs font-black text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      {String(b.name || '').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors duration-300 tracking-tight line-clamp-1">
                  {b.name}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Car}
            title={brands.length ? 'No brands match that search' : 'No brands listed yet'}
            body={brands.length ? 'Try a different name.' : 'Manufacturers appear here as inventory is added.'}
          />
        )}
      </Section>

      <Section bg>
        <WhyBrands />
      </Section>

      <Section className="bg-gradient-to-b from-blue-50/70">
        <FaqsSection
          faqs={BRAND_FAQS}
          subtitle="Simple answers about brands, buying, and selling on 4tyrezz."
        />
      </Section>
    </div>
  );
}
