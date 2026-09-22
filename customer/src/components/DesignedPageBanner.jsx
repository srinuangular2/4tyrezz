import { Link } from 'react-router-dom';

export default function DesignedPageBanner({
  src,
  alt,
  eyebrow,
  title,
  accent,
  subtitle,
  points = [],
  children,
  imageClass = 'object-[78%_center] sm:object-right',
}) {
  return (
    <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] lg:min-h-[540px]">
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover ${imageClass}`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061a4a]/92 via-[#1853ff]/42 to-transparent sm:via-[#1853ff]/22" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10 sm:hidden" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="max-w-xl">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md mb-5">
              <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
              {eyebrow}
            </span>
          )}

          <h1 className="text-3xl sm:text-5xl uppercase tracking-tight font-display text-white leading-tight">
            {title} {accent ? <span className="font-black">{accent}</span> : null}
          </h1>

          {subtitle && (
            <p className="text-white/85 text-sm sm:text-base font-medium mt-4 max-w-md leading-relaxed">
              {subtitle}
            </p>
          )}

          {points.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-x-2 gap-y-3">
              {points.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                  <span className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#9ad4ff]" strokeWidth={2.4} />
                  </span>
                  {label}
                </span>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  );
}

export function BannerActions({ children }) {
  return <div className="mt-8 flex flex-wrap gap-3">{children}</div>;
}

export function BannerButton({ to, href, children, ghost }) {
  const className = ghost
    ? 'inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/12 border border-white/30 text-white font-black text-xs uppercase tracking-wider backdrop-blur-md hover:bg-white/20 transition'
    : 'inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-[#1853ff] font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition';

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  const external = typeof href === 'string' && href.startsWith('http');
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}
