import { Link } from 'react-router-dom';

export const BRAND = '#3083ff';

/**
 * Section header typography mirrors Home.jsx: a wide-tracked uppercase eyebrow
 * above a Montserrat display title whose final word is weighted heavier.
 */
function FormattedTitle({ children }) {
  if (!children) return null;
  if (typeof children !== 'string') return children;

  const words = children.trim().split(' ');
  if (words.length <= 1) return <span className="font-normal">{children}</span>;

  const lastWord = words.pop();
  return (
    <span className="font-normal text-slate-800">
      {words.join(' ')} <span className="font-black text-slate-900">{lastWord}</span>
    </span>
  );
}

export function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #14264a 55%, #1853ff 130%)' }}
      />
      <div
        className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #3083ff 0%, transparent 70%)' }}
      />
      <div className="absolute top-0 inset-x-0 h-1 bg-brand-beam" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {eyebrow && (
          <p className="text-[13px] font-medium text-white/50 uppercase tracking-[5px] font-display mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-5xl uppercase tracking-tight font-display text-white">
          {typeof title === 'string' ? (
            <>
              {title.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="font-black">{title.split(' ').slice(-1)}</span>
            </>
          ) : (
            title
          )}
        </h1>
        {subtitle && (
          <p className="text-white/70 text-sm sm:text-base font-medium mt-4 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function Section({ eyebrow, title, children, bg, viewAllHref, viewAllLabel = 'View All', className = '' }) {
  return (
    <section className={`${bg ? 'bg-white' : ''} py-6 lg:py-12 ${className}`}>
      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8">
        {(eyebrow || title || viewAllHref) && (
          <div className="flex items-center lg:items-end justify-between pb-2 mb-3 lg:pb-3 lg:mb-5 border-b border-slate-100">
            <div>
              {eyebrow && (
                <p className="hidden sm:block text-[14px] font-medium text-[#909294] uppercase tracking-[5px] font-display mb-3">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="text-[17px] lg:text-4xl lg:uppercase tracking-tight font-display">
                  <FormattedTitle>{title}</FormattedTitle>
                </h2>
              )}
            </div>
            {viewAllHref && (
              <Link
                to={viewAllHref}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-black hover:text-[#3083ff] transition-all group font-display uppercase tracking-wider mb-1"
              >
                <span>{viewAllLabel}</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** Frosted glass card with the hover beam used across the Home sections. */
export function Card({ children, className = '', hover = true, beam = true, highlighted = false }) {
  return (
    <div
      className={`group relative rounded-3xl bg-white/40 backdrop-blur-xl border overflow-hidden ${
        highlighted
          ? 'border-[#3083ff]/45 shadow-[0_16px_40px_0_rgba(48,131,255,0.14)]'
          : 'border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]'
      } ${
        hover && !highlighted
          ? 'hover:shadow-[0_20px_40px_0_rgba(48,131,255,0.15)] hover:border-[#3083ff]/40 transition-all duration-500'
          : 'transition-all duration-500'
      } ${className}`}
    >
      {beam && (
        <div
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-[#3083ff] to-indigo-500 ${
            highlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity duration-500`}
        />
      )}
      {children}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="block">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-[11px] font-medium text-slate-400 mt-1 block">{hint}</span>}
    </div>
  );
}

export const inputClass =
  'w-full bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#3083ff] focus:ring-2 focus:ring-[#3083ff]/20 shadow-sm transition';

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 bg-[#3083ff] hover:bg-[#1853ff] text-white font-black text-xs uppercase tracking-wider rounded-xl px-6 py-3.5 shadow-md hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md border border-slate-200/80 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl px-6 py-3.5 hover:bg-white hover:border-[#3083ff]/40 hover:text-[#3083ff] active:scale-95 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Small pill button matching the CategoryBox pills on Home. */
export function Pill({ active, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm active:scale-95 transition-all duration-200 ${
        active
          ? 'bg-[#3083ff] text-white border-[#3083ff] shadow-blue-500/20'
          : 'bg-white/60 backdrop-blur-md text-slate-700 border-slate-200/60 hover:bg-[#3083ff] hover:text-white hover:border-[#3083ff]'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="rounded-3xl bg-white/40 backdrop-blur-xl border border-dashed border-slate-300 px-6 py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3083ff] to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20">
          <Icon className="w-7 h-7 text-white" strokeWidth={2.25} />
        </div>
      )}
      <h3 className="font-display font-black text-slate-900 text-lg uppercase tracking-tight">{title}</h3>
      {body && <p className="text-sm font-medium text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">{body}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200/70 rounded-2xl ${className}`} />;
}

/** Stat block used in page heroes. */
export function HeroStat({ value, label }) {
  return (
    <div>
      <div className="font-display font-black text-white text-2xl sm:text-3xl tracking-tight">{value}</div>
      <div className="text-[10px] font-black text-white/50 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export function formatINR(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
