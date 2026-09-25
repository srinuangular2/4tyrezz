export function mediaUrl(path) {
  if (!path) return '';
  // Rewrite legacy absolute localhost URLs so phones on LAN still work
  const rewritten = String(path).replace(/^https?:\/\/localhost(:\d+)?/i, '');
  if (/^https?:\/\//i.test(rewritten) || rewritten.startsWith('data:')) return rewritten;
  const normalized = rewritten.startsWith('/') ? rewritten : `/${rewritten}`;
  // Only prefix an absolute API origin when explicitly set (e.g. production).
  // Locally / on LAN, use relative /uploads so Vite proxy works from phone too.
  const origin = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');
  return origin ? `${origin}${normalized}` : normalized;
}
