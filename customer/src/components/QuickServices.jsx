// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// const SERVICES = [
//   {
//     id: 'buy',
//     title: 'Buy Used Cars',
//     subtitle: 'Explore 1,200+ certified pre-owned vehicles with inspection reports.',
//     badge: 'Verified Stock',
//     cta: 'Browse Cars',
//     link: '/cars',
//     bgColor: 'bg-blue-50/60 hover:bg-blue-50',
//     iconColor: 'bg-[#0052ff] text-white',
//     icon: (
//       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//       </svg>
//     ),
//   },
//   {
//     id: 'sell',
//     title: 'Sell or Exchange',
//     subtitle: 'Get instantly evaluated online and sell your car at the best market price.',
//     badge: 'Instant Quote',
//     cta: 'Get Valuation',
//     link: '/sell-car',
//     bgColor: 'bg-slate-50 hover:bg-slate-100/80',
//     iconColor: 'bg-slate-900 text-white',
//     icon: (
//       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
//       </svg>
//     ),
//   },
//   {
//     id: 'finance',
//     title: 'Finance & Loans',
//     subtitle: 'Low EMI interest rates starting at 8.5% with instant digital approval.',
//     badge: 'Quick Approval',
//     cta: 'Check Eligibility',
//     link: '/finance',
//     bgColor: 'bg-blue-50/60 hover:bg-blue-50',
//     iconColor: 'bg-[#0052ff] text-white',
//     icon: (
//       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//       </svg>
//     ),
//   },
//   {
//     id: 'insurance',
//     title: 'Car Insurance',
//     subtitle: 'Comprehensive paperless coverage with seamless claim settlement.',
//     badge: 'Save up to 40%',
//     cta: 'Get Renewal Quote',
//     link: '/insurance',
//     bgColor: 'bg-slate-50 hover:bg-slate-100/80',
//     iconColor: 'bg-slate-900 text-white',
//     icon: (
//       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//       </svg>
//     ),
//   },
// ];

// export default function QuickServices() {
//   const navigate = useNavigate();

//   return (
//     <section className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {SERVICES.map((item) => (
//           <div
//             key={item.id}
//             onClick={() => navigate(item.link)}
//             className={`group cursor-pointer rounded-2xl p-5 border border-slate-200/80 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${item.bgColor} flex flex-col justify-between`}
//           >
//             <div>
//               {/* Header: Icon & Badge */}
//               <div className="flex items-center justify-between mb-4">
//                 <div className={`p-3 rounded-xl shadow-sm ${item.iconColor} transition-transform duration-300 group-hover:scale-110`}>
//                   {item.icon}
//                 </div>
//                 <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-white/90 border border-slate-200/60 px-2.5 py-1 rounded-full font-display">
//                   {item.badge}
//                 </span>
//               </div>

//               {/* Text Content */}
//               <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-display group-hover:text-[#0052ff] transition-colors">
//                 {item.title}
//               </h3>
//               <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-body">
//                 {item.subtitle}
//               </p>
//             </div>

//             {/* Bottom Action Link */}
//             <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0052ff] font-display">
//               <span>{item.cta}</span>
//               <svg 
//                 className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
//               </svg>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }


import React from 'react';
import { useNavigate } from 'react-router-dom';

const SERVICES = [
  {
    id: 'buy',
    title: 'Buy Certified Cars',
    subtitle: 'Explore 1,200+ multi-point inspected pre-owned vehicles with warranty.',
    badge: '100% Verified',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cta: 'Browse Inventory',
    link: '/cars',
    // Theme Colors
    cardBg: 'bg-gradient-to-b from-blue-50/70 to-white hover:from-blue-100/80',
    borderColor: 'border-blue-100 hover:border-blue-300',
    iconBg: 'bg-[#0052ff] text-white shadow-blue-500/20',
    accentDot: 'bg-[#0052ff]',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'sell',
    title: 'Sell Your Car',
    subtitle: 'Free door-step evaluation and same-day payment at the guaranteed best price.',
    badge: 'Instant Cash',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    cta: 'Get Online Valuation',
    link: '/sell',
    // Theme Colors
    cardBg: 'bg-gradient-to-b from-slate-50 to-white hover:from-slate-100/90',
    borderColor: 'border-slate-200 hover:border-slate-400',
    iconBg: 'bg-slate-900 text-white shadow-slate-900/20',
    accentDot: 'bg-slate-900',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    id: 'finance',
    title: 'Car Finance & EMI',
    subtitle: 'Competitive interest rates starting at 8.5% with zero processing fee deals.',
    badge: 'Fast Approval',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cta: 'Calculate EMI',
    link: '/finance',
    // Theme Colors
    cardBg: 'bg-gradient-to-b from-indigo-50/70 to-white hover:from-indigo-100/80',
    borderColor: 'border-indigo-100 hover:border-indigo-300',
    iconBg: 'bg-indigo-600 text-white shadow-indigo-500/20',
    accentDot: 'bg-indigo-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'insurance',
    title: 'Insurance Renewal',
    subtitle: 'Instant paperless policy renewal with cashless claims across 5,000+ garages.',
    badge: 'Save up to 40%',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    cta: 'Check Premium',
    link: '/insurance',
    // Theme Colors
    cardBg: 'bg-gradient-to-b from-sky-50/70 to-white hover:from-sky-100/80',
    borderColor: 'border-sky-100 hover:border-sky-300',
    iconBg: 'bg-sky-600 text-white shadow-sky-500/20',
    accentDot: 'bg-sky-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function QuickServices() {
  const navigate = useNavigate();

  return (
    <section className="relative z-30 max-w-7xl mx-auto font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SERVICES.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.link)}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl p-6 border ${item.borderColor} ${item.cardBg} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between`}
          >
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${item.accentDot} opacity-80 group-hover:opacity-100 transition-opacity`} />

            <div>
              {/* Header: Icon & Category Badge */}
              <div className="flex items-center justify-between mb-5">
                <div className={`p-3.5 rounded-2xl shadow-md ${item.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider border px-3 py-1 rounded-full font-display ${item.badgeStyle}`}>
                  {item.badge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-lg font-black text-slate-900 tracking-tight font-display group-hover:text-[#0052ff] transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-body">
                {item.subtitle}
              </p>
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-[#0052ff] transition-colors font-display">
              <span>{item.cta}</span>
              <div className="p-1 rounded-full bg-white group-hover:bg-[#0052ff] group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200 group-hover:border-[#0052ff]">
                <svg 
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}