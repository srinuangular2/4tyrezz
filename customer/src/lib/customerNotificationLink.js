function staffLink(link) {
  const path = String(link || '');
  return path.startsWith('/dealer')
    || path.startsWith('/leads')
    || path.startsWith('/approvals')
    || path.startsWith('/bookings')
    || path.startsWith('/test-drives')
    || path.startsWith('/listings')
    || path === '/finance'
    || path === '/insurance'
    || path.startsWith('/dealers');
}

export function customerNotificationLink(item) {
  if (!item) return '';
  const event = item.event || item.meta?.event || '';
  const type = String(item.type || '').toLowerCase();
  const raw = item.link || '';
  const carId = item.meta?.carId ? String(item.meta.carId) : '';
  const ownerAlert = item.recipientRole === 'dealer' || item.recipientRole === 'admin' || staffLink(raw);
  if (raw.startsWith('/profile/') || raw.startsWith('/cars/')) return raw;
  if (event === 'NEW_LEAD' || type === 'lead' || type === 'enquiry') return '/profile/enquiries';
  if (ownerAlert) return carId ? `/cars/${carId}` : '/profile/my-vehicles';
  if (event === 'NEW_FINANCE' || type === 'finance') return '/profile/finance-applications';
  if (event === 'NEW_INSURANCE' || type === 'insurance') return '/profile/insurance-enquiries';
  if (event === 'NEW_BOOKING' || type === 'booking') return '/profile/orders';
  if (event === 'NEW_TEST_DRIVE' || type === 'test_drive' || type === 'testdrive') return '/profile/test-drives';
  return raw;
}
