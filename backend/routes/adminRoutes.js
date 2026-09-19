const router = require('express').Router();
const { protect, protectAdminRoute } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const dash = require('../controllers/adminDashboardController');
const dealers = require('../controllers/dealerApprovalController');
const moderation = require('../controllers/contentModerationController');
const inventory = require('../controllers/inventoryController');
const booking = require('../controllers/bookingController');
const support = require('../controllers/supportController');
const review = require('../controllers/reviewController');

router.use(protect, protectAdminRoute);

router.get('/stats', dash.metrics);
router.get('/metrics', dash.metrics);
router.get('/reports', dash.reports);
router.get('/settings', dash.getSettings);
router.put('/settings', dash.updateSettings);

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/toggle-active', ctrl.toggleUserActive);

router.patch('/cars/:id/status', ctrl.setCarStatus);
router.patch('/cars/:id/flag', ctrl.toggleCarFlag);

router.get('/dealers', dealers.listDealers);
router.post('/dealers', dealers.createDealer);
router.get('/dealers/pending', dealers.listPending);
router.get('/dealers/:id', dealers.getDealer);
router.get('/dealers/:id/performance', dealers.performance);
router.patch('/dealers/:id', dealers.updateDealer);
router.patch('/dealers/:id/status', dealers.setStatus);
router.post('/dealers/:id/credentials', dealers.resetCredentials);
router.delete('/dealers/:id', dealers.deleteDealer);

router.get('/moderation/queue', moderation.queue);
router.get('/moderation/flagged', moderation.flagged);
router.get('/listings/moderation', moderation.queue);
router.patch('/listings/:id/approve', moderation.approve);
router.patch('/listings/:id/reject', moderation.reject);
router.patch('/listings/:id/moderate', inventory.moderate);

router.get('/leads', dash.listLeads);
router.patch('/leads/:id/stage', dash.updateLeadStage);
router.get('/test-drives', dash.listTestDrives);
router.get('/bookings', dash.listBookings);
router.get('/payments', dash.listPayments);
router.patch('/payments/:id/refund', dash.refundPayment);
router.get('/reviews', dash.listReviewsAdmin);
router.patch('/reviews/:id', review.moderate);

router.get('/commissions', booking.listCommissions);
router.patch('/commissions/:id', booking.updateCommission);
router.post('/commissions/:id/settle', booking.settleCommission);
router.post('/commissions/settle-dealer', booking.settleDealerCommissions);
router.get('/commissions/ledger', booking.listLedger);

router.get('/support', support.list);
router.patch('/support/:id', support.update);
router.post('/support/:id/reply', support.reply);

module.exports = router;
