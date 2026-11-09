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
  hideOnMobile = false,
}) {
  return (
    <>
    <section className={`relative overflow-hidden lg:hidden ${hideOnMobile ? 'hidden' : ''}`}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-[82%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/25" />
      <div className="relative px-4 py-4">
        {eyebrow && <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/80">{eyebrow}</p>}
        <h1 className="mt-1 max-w-[18rem] text-[15px] font-medium leading-snug text-white">
          {title}{accent ? <span> {accent}</span> : null}
        </h1>
        {subtitle && <p className="mt-1 max-w-[18rem] text-xs font-light leading-snug text-white/90 line-clamp-2">{subtitle}</p>}
        {points.length > 0 && (
          <div className="mt-2.5 grid max-w-[16rem] grid-cols-2 gap-x-2 gap-y-1.5">
            {points.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white">
                <Icon className="h-3.5 w-3.5 shrink-0 text-white/80" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
    <section className="relative hidden overflow-hidden lg:block">
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover ${imageClass}`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent" />

      <div className="relative mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          {eyebrow && (
            <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/80 backdrop-blur-md sm:mb-5 sm:px-4 sm:py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
              {eyebrow}
            </span>
          )}

          <h1 className="text-xl font-medium leading-snug tracking-tight text-white sm:text-2xl">
            {title} {accent ? <span className="font-medium">{accent}</span> : null}
          </h1>

          {subtitle && (
            <p className="mt-1.5 max-w-md text-xs font-light leading-relaxed text-white/85 line-clamp-2 sm:text-sm">
              {subtitle}
            </p>
          )}

          {points.length > 0 && (
            <div className="mt-3 sm:mt-8 grid grid-cols-2 gap-x-2 gap-y-2 sm:gap-y-3">
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
    </>
  );
}

export function BannerActions({ children }) {
  return <div className="mt-3 flex flex-wrap gap-2 lg:mt-8 lg:gap-3">{children}</div>;
}

export function BannerButton({ to, href, children, ghost }) {
  const className = ghost
    ? 'inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/15 px-3.5 py-2 text-[12px] font-semibold text-white backdrop-blur-md lg:px-6 lg:py-3 lg:text-xs lg:font-black lg:uppercase lg:tracking-wider lg:hover:bg-white/25'
    : 'inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2 text-[12px] font-semibold text-[#1853ff] lg:px-6 lg:py-3 lg:text-xs lg:font-black lg:uppercase lg:tracking-wider lg:hover:bg-slate-100';

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
