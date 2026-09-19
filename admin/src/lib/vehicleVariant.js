export function isAutomatic(value) {
  return /auto|cvt|ivt|dct|amt|at/i.test(String(value || ''));
}

export function variantRowKey(v = {}) {
  const name = v.variant || v.name || '';
  return `${name}::${v.fuelType || ''}::${v.transmission || ''}`;
}

export function variantMatches(v, variant, transmission) {
  const name = v.variant || v.name || '';
  if (name !== variant) return false;
  if (!transmission) return true;
  return String(v.transmission || '') === String(transmission);
}
