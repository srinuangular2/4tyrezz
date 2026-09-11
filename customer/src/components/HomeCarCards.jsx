import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeCarCards({ eyebrow, title, viewAllHref, children, className = '' }) {
  // Utility function to split "FEATURED CARS" -> "FEATURED " + "CARS" (bolded last word)
  const renderFormattedTitle = (text) => {
    if (!text) return null;
    const words = text.trim().split(' ');
    if (words.length <= 1) return text;

    const lastWord = words.pop();
    const mainText = words.join(' ');

    return (
      <>
        {mainText}{' '}
        <span className="text-[#0052ff] font-black">{lastWord}</span>
      </>
    );
  };

  return (
    <section className={`py-10 ${className}`}>
      <div className="container-px">
        {/* Header Bar */}
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            {/* Red/Blue Accent Eyebrow */}
            {eyebrow && (
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0052ff] block">
                {eyebrow} 11
              </span>
            )}

            {/* Main Title with Styled Accent Word */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display uppercase">
              {renderFormattedTitle(title)}
            </h2>
          </div>

          {/* View All Action Button */}
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0052ff] hover:text-[#0042cc] transition-all group font-display"
            >
              <span>View All</span>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          )}
        </div>

        {/* Component Content */}
        <div>{children}</div>
      </div>
    </section>
  );
}