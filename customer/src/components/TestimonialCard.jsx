import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

export const DEFAULT_TESTIMONIALS = [
  {
    name: 'Rajesh Sharma',
    role: 'Verified Buyer',
    rating: 5,
    location: 'Hyderabad',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    text: 'Bought a certified pre-owned Maruti Swift. The 140-point inspection checklist gave me complete peace of mind. Zero engine issues after 6 months of driving!',
  },
  {
    name: 'Ananya Verma',
    role: 'Car Seller',
    rating: 5,
    location: 'Bangalore',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    text: 'Sold my Hyundai i20 within 2 hours of listing. Got ₹35,000 more than what local dealers offered, and the RC transfer was tracked completely online.',
  },
  {
    name: 'Vikramjit Singh',
    role: 'Used SUV Owner',
    rating: 5,
    location: 'Delhi NCR',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    text: 'Financed a 2021 Mahindra Thar through their portal. The EMI approval took under 4 hours with minimum documentation. Truly a seamless digital experience.',
  },
  {
    name: 'Priya Sundaram',
    role: 'First-time Buyer',
    rating: 5,
    location: 'Chennai',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    text: 'Being a first-time buyer, I was worried about hidden damages in used cars. Their detailed digital inspection report and 7-day money-back guarantee won me over.',
  },
  {
    name: 'Suresh Patil',
    role: 'Exchange Customer',
    rating: 5,
    location: 'Mumbai',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    text: 'Exchanged my 8-year-old WagonR for a certified Honda City. The doorstep doorstep evaluation and instant payout made the trade-in completely effortless.',
  },
  {
    name: 'Amitabh Choudhury',
    role: 'Verified Buyer',
    rating: 5,
    location: 'Kolkata',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    text: 'Found a pristine Tata Nexon with genuine ODO reading. Verified service history and transparent pricing made this the best car purchase experience so far.',
  },
  {
    name: 'Sneha Deshmukh',
    role: 'Car Seller',
    rating: 5,
    location: 'Pune',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&q=80',
    text: 'The home-inspection executive was very professional. Received full payment instantly in my bank account before handing over the keys.',
  },
  {
    name: 'Karan Malhotra',
    role: 'Luxury Car Buyer',
    rating: 5,
    location: 'Chandigarh',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    text: 'Secured a pre-owned BMW 3 Series in show-room condition. Their luxury vehicle specialists double-checked all electronic and mechanical components.',
  },
  {
    name: 'Meera Nair',
    role: 'Verified Buyer',
    rating: 5,
    location: 'Kochi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    text: 'Loved the test drive at home facility! The car was sanitized and delivered right to my apartment driveway for evaluation.',
  },
  {
    name: 'Rohan Joshi',
    role: 'Car Seller',
    rating: 5,
    location: 'Ahmedabad',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    text: 'No haggling or dealing with multiple unknown buyers. Listing here got me direct verified offers with guaranteed RC transfer safety.',
  },
  {
    name: 'Deepak Reddy',
    role: 'Fleet Buyer',
    rating: 5,
    location: 'Vijayawada',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    text: 'Bought 3 pre-owned commercial hatchbacks for my travel agency. Outstanding bulk discount options and quick commercial finance clearance.',
  },
  {
    name: 'Pooja Agarwal',
    role: 'Verified Buyer',
    rating: 5,
    location: 'Jaipur',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    text: 'The 1-year complimentary warranty on engine and gearbox gave me confidence to choose a used automatic car. Exceptional customer support!',
  },
];

// Single Stacked Document Card
export function TestimonialItem({ testimonial }) {
  if (!testimonial) return null;

  return (
    <div className="group relative w-full pt-6 pb-2 px-2 transition-transform duration-500 hover:-translate-y-2">
      {/* Stacked Card Back Layers */}
      <div className="absolute top-0 left-6 right-6 h-full rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 border border-slate-300/40 -rotate-3 scale-[0.92] transition-transform duration-500 group-hover:-rotate-6" />
      <div className="absolute top-2 left-4 right-4 h-full rounded-3xl bg-slate-300/50 dark:bg-slate-700/50 border border-slate-300/50 rotate-2 scale-[0.96] transition-transform duration-500 group-hover:rotate-4" />

      {/* Main Front Document Card */}
      <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-slate-800 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08)] group-hover:shadow-[0_25px_50px_-12px_rgba(48,131,255,0.22)] group-hover:border-[#3083ff]/40 transition-all duration-500 overflow-hidden">
        {/* Quote Badge Accent */}
        <div className="absolute top-4 right-5 w-10 h-10 rounded-2xl bg-[#3083ff]/10 text-[#3083ff] flex items-center justify-center font-black text-xl select-none group-hover:scale-110 group-hover:bg-[#3083ff] group-hover:text-white transition-all duration-300">
          “
        </div>

        <div>
          {/* Rating & Role */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <span className="text-amber-500 text-xs">★</span>
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                {testimonial.rating || 5}.0
              </span>
            </div>

            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20">
              {testimonial.role || 'Verified Buyer'}
            </span>
          </div>

          {/* Review Text */}
          <p className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium leading-relaxed italic pr-6">
            "{testimonial.text}"
          </p>
        </div>

        {/* User Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3.5">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3083ff] to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md">
              {testimonial.name ? testimonial.name[0].toUpperCase() : 'U'}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              {testimonial.name}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 truncate">
              {testimonial.location || 'Verified Customer'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default Export Component
export default function TestimonialCard({ testimonials = DEFAULT_TESTIMONIALS }) {
  const testPrevRef = useRef(null);
  const testNextRef = useRef(null);

  return (
    <section className="relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
          User Reviews
        </span>
        <h2 className="text-3xl sm:text-4xl uppercase tracking-tight font-display">
          What Car <span className='font-black text-slate-900'>Buyers</span> & <span className='font-black text-slate-900'>Sellers Say</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          Real experiences from verified car buyers, sellers, and exchange customers across India.
        </p>
      </div>

      <div className="relative max-w-7xl mx-auto px-2">
        {/* Nav Buttons */}
        <button
          ref={testPrevRef}
          aria-label="Previous testimonials"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-30 w-11 h-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all duration-300 shadow-xl flex items-center justify-center font-bold text-xl cursor-pointer"
        >
          ‹
        </button>
        <button
          ref={testNextRef}
          aria-label="Next testimonials"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-30 w-11 h-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff] transition-all duration-300 shadow-xl flex items-center justify-center font-bold text-xl cursor-pointer"
        >
          ›
        </button>

        {/* Swiper Slider */}
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = testPrevRef.current;
            swiper.params.navigation.nextEl = testNextRef.current;
          }}
          navigation={{ prevEl: testPrevRef.current, nextEl: testNextRef.current }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="w-full !py-6"
        >
          {testimonials.map((t, idx) => (
            <SwiperSlide key={t.name || idx} className="h-auto">
              <TestimonialItem testimonial={t} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}