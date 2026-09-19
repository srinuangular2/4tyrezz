export function dealerPortalUrl(path = '/dealer/login') {
  const normalized = path.startsWith('/dealer') ? path : `/dealer${path.startsWith('/') ? path : `/${path}`}`;
  const origin = import.meta.env.VITE_DEALER_URL || (import.meta.env.DEV ? 'http://localhost:5175' : '');
  if (!origin) return normalized;
  return `${String(origin).replace(/\/$/, '')}${normalized}`;
}

export function openDealerPortal(path = '/dealer/login') {
  window.location.replace(dealerPortalUrl(path));
}
