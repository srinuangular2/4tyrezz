export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const origin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';
  return `${origin}${path}`;
}
