import React from 'react';
import { Link } from 'react-router-dom';
import sectionBg from '../public/section-bg.jpg';

export default function CarBannerSection() {
  return (
    <section className="relative mx-auto overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={sectionBg}
          alt="4Tyrezz Premium Tyre Services"
          className="w-full h-full object-cover object-right sm:object-center grayscale brightness-90 contrast-105"
        />

        {/* Previous Blue Gradient with Horizontal Mask (Only Left Side Covered) */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#3083ff] via-blue-700 to-slate-900 mix-blend-multiply"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 80%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Soft Dark Shadow Behind Left Text Only */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 65%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 65%)',
          }}
        />
      </div>

      {/* Content Layer */}
      <div className='container-px'>
      <div className="relative z-10 p-8 sm:py-12 lg:py-16 max-w-2xl">
        {/* Eyebrow Badge */}
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#3083ff]/20 text-[#3083ff] border border-[#3083ff]/40 backdrop-blur-md mb-6">
          <span className="w-2 h-2 rounded-full bg-[#3083ff] animate-pulse" />
          Exclusive Offers & Deals
        </span>

        {/* Main Title */}
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Exclusive 4Tyrezz <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3083ff] via-sky-300 to-cyan-300">
            Offers & Deals
          </span>
        </h2>

        {/* Subtitle / Description */}
        <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed mb-8">
          Get top-brand tyres at unbeatable prices with free installation, 3D wheel alignment, and instant doorstep fitting across Hyderabad.
        </p>

        {/* Glassmorphism Feature Cards Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3.5 rounded-2xl bg-blue-900/30 backdrop-blur-md border border-[#3083ff]/40 text-center">
            <span className="block font-black text-xl text-white">Up to 25%</span>
            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Brand Discounts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-900/30 backdrop-blur-md border border-[#3083ff]/40 text-center">
            <span className="block font-black text-xl text-white">FREE</span>
            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">3D Alignment</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-900/30 backdrop-blur-md border border-[#3083ff]/40 text-center">
            <span className="block font-black text-xl text-white">3 Years</span>
            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Warranty Cover</span>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/offers" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#3083ff] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#3083ff]/40 transition-all duration-300 cursor-pointer">
            Claim Offer Now
          </Link>
          <Link to="/contact" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-xs uppercase tracking-wider backdrop-blur-md transition-all duration-300 cursor-pointer">
            Book Doorstep Fitting
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}