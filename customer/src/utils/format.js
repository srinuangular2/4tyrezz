export const formatPrice = (n) => {
  if (n == null) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} Lakh`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
};

export const formatKm = (n) => (n == null ? '—' : `${Number(n).toLocaleString('en-IN')} km`);
