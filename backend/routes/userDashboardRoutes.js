const router = require('express').Router();
const { protect, protectCustomerRoute } = require('../middleware/auth');
const dash = require('../controllers/userDashboardController');
const portal = require('../controllers/customerPortalController');
const { uploadAvatar } = require('../middleware/upload');

const customer = [protect, protectCustomerRoute];

router.get('/orders', protect, dash.listOrders);
router.get('/wishlist', protect, portal.listWishlist);
router.post('/wishlist/toggle', protect, dash.toggleWishlist);
router.get('/activity', protect, dash.listActivity);
router.get('/garage', protect, dash.listGarage);
router.post('/garage', protect, dash.addGarage);
router.put('/garage/:id', protect, dash.updateGarage);
router.delete('/garage/:id', protect, dash.removeGarage);
router.get('/my-vehicles', protect, dash.listMyVehicles);
router.get('/consents', protect, dash.getConsents);
router.put('/consents', protect, dash.updateConsents);
router.get('/addresses', protect, dash.listAddresses);
router.post('/addresses', protect, dash.addAddress);
router.put('/addresses/:id', protect, dash.updateAddress);
router.delete('/addresses/:id', protect, dash.removeAddress);
router.put('/settings', protect, dash.updateSettings);

router.get('/profile', ...customer, portal.getProfile);
router.put('/profile', ...customer, portal.updatePreferences);
router.put('/profile/preferences', ...customer, portal.updatePreferences);
router.post('/profile-photo', ...customer, uploadAvatar.single('photo'), portal.uploadPhoto);
router.get('/enquiries', ...customer, portal.listEnquiries);
router.get('/test-drives', ...customer, portal.listTestDrives);
router.get('/bookings', ...customer, portal.listBookings);
router.get('/bookings/:id/receipt', ...customer, portal.bookingReceipt);
router.get('/finance-applications', ...customer, portal.listFinance);
router.get('/insurance-enquiries', ...customer, portal.listInsurance);
router.get('/comparisons', ...customer, portal.listComparisons);
router.post('/comparisons', ...customer, portal.saveComparison);
router.delete('/comparisons/:id', ...customer, portal.removeComparison);
router.get('/saved-searches', ...customer, portal.listSavedSearches);
router.patch('/saved-searches/:id/alerts', ...customer, portal.toggleSavedSearchAlerts);

module.exports = router;
