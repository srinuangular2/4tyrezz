import React from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../pages/profile/hubUtils';

export default function DealerCard({ dealer }) {
  if (!dealer) return null;

  return (
    <div className="group relative flex flex-col justify-between h-full p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-[0_20px_40px_0_rgba(48,131,255,0.18)] hover:border-[#3083ff]/50 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden">
      
      {/* Top Glowing Beam Accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-[#3083ff] to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div>
        {/* Header Badges & Rating */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#3083ff]/10 text-[#3083ff] border border-[#3083ff]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3083ff] animate-pulse" />
            {dealer.badge || 'Verified Partner'}
          </span>

          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            <span className="text-amber-500 text-xs">★</span>
            <span className="text-xs font-black text-amber-600">
              {dealer.rating || '4.9'}
            </span>
          </div>
        </div>

        {/* Dealer Profile Information */}
        <div className="flex items-center gap-4 my-2">
          {/* Dealer Avatar / Logo Container */}
          <div className="relative w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 p-1 shrink-0 group-hover:scale-105 transition-transform duration-300">
            {dealer.logo || dealer.image ? (
              <img
                src={mediaUrl(dealer.logo || dealer.image)}
                alt={dealer.name || 'Dealer'}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#3083ff] to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-inner">
                {dealer.name ? dealer.name.substring(0, 2).toUpperCase() : 'D'}
              </div>
            )}

            {/* Verified Icon Badge */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#3083ff] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
              ✓
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate group-hover:text-[#3083ff] transition-colors">
              {dealer.name}
            </h4>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{dealer.city || dealer.location || 'Hyderabad'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Action Strip */}
      <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">In Stock</span>
          <span className="font-extrabold text-sm text-slate-900">
            {dealer.inventory || '25+ Vehicles'}
          </span>
        </div>

        <Link
          to={`/cars?dealer=${dealer._id || dealer.name}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white group-hover:bg-[#3083ff] text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300"
        >
          <span>View Showroom</span>
          <span className="font-black group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

    </div>
  );
}