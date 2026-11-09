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
    <section className={`relative min-h-[300px] overflow-hidden lg:hidden ${hideOnMobile ? 'hidden' : ''}`}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-[85%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061433]/90 via-[#0b2a6e]/62 to-[#0b2a6e]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061433]/55 via-transparent to-[#061433]/25" />
      <div className="relative px-4 py-5">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wide text-white">{eyebrow}</p>}
        <h1 className="mt-1 max-w-[18rem] text-[20px] font-semibold leading-snug text-white">
          {title}{accent ? <span className="font-bold"> {accent}</span> : null}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-[20rem] text-[13px] font-normal leading-snug text-white/90">{subtitle}</p>}
        {points.length > 0 && (
          <div className="mt-3 grid max-w-[22rem] grid-cols-2 gap-2">
            {points.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 text-[12px] font-semibold text-white">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15">
                  <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
                </span>
                {label}
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
    <section className="relative hidden overflow-hidden min-h-[210px] sm:min-h-[480px] lg:block lg:min-h-[540px]">
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover ${imageClass}`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061a4a]/92 via-[#1853ff]/42 to-transparent sm:via-[#1853ff]/22" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10 sm:hidden" />

      <div className="relative container-px mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-14 lg:py-16">
        <div className="max-w-xl">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md mb-2 sm:mb-5">
              <span className="w-2 h-2 rounded-full bg-[#7ec4ff] animate-pulse" />
              {eyebrow}
            </span>
          )}

          <h1 className="text-xl sm:text-5xl sm:uppercase tracking-tight font-display text-white leading-tight">
            {title} {accent ? <span className="font-black">{accent}</span> : null}
          </h1>

          {subtitle && (
            <p className="text-white/85 text-xs sm:text-base font-medium mt-2 sm:mt-4 max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none">
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
