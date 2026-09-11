const express = require('express');
const router = express.Router();
const dealer = require('../controllers/dealerController');
const kyc = require('../controllers/dealerKycController');
const ops = require('../controllers/dealerOpsController');
const workspace = require('../controllers/dealerWorkspaceController');
const portal = require('../controllers/dealerPortalController');
const inventory = require('../controllers/inventoryController');
const { optionalAuth, protect, requireDealerKyc, protectDealerRoute } = require('../middleware/auth');
const { uploadBulkInventory } = require('../middleware/upload');

const dealerOnly = [protect, protectDealerRoute];

router.post('/otp/request', kyc.requestDealerOtp);
router.post('/otp/verify', kyc.verifyDealerOtp);
router.post('/verify-kyc', optionalAuth, kyc.verifyKyc);

router.get('/onboarding', ...dealerOnly, portal.getOnboarding);
router.put('/onboarding', ...dealerOnly, portal.saveOnboarding);
router.post('/onboarding/submit', ...dealerOnly, portal.submitOnboarding);

router.get('/dashboard/kpis', ...dealerOnly, portal.dashboardKpis);
router.get('/analytics/reports', ...dealerOnly, portal.analyticsReports);
router.get('/analytics/performance', ...dealerOnly, workspace.performance);
router.get('/analytics', ...dealerOnly, ops.analytics);

router.get('/inventory/bulk-template', ...dealerOnly, workspace.templateCsv);
router.post('/inventory/bulk-upload', ...dealerOnly, requireDealerKyc, uploadBulkInventory.single('file'), workspace.bulkUpload);
router.post('/inventory/bulk-import', ...dealerOnly, requireDealerKyc, uploadBulkInventory.single('file'), workspace.bulkUpload);
router.patch('/inventory/bulk', ...dealerOnly, requireDealerKyc, inventory.bulkActions);
router.get('/inventory', ...dealerOnly, inventory.list);
router.patch('/inventory/:id/publish', ...dealerOnly, requireDealerKyc, inventory.togglePublish);
router.patch('/inventory/:id/sold', ...dealerOnly, requireDealerKyc, inventory.markSold);
router.patch('/inventory/:id/price', ...dealerOnly, requireDealerKyc, inventory.updatePrice);
router.patch('/inventory/:id/availability', ...dealerOnly, requireDealerKyc, inventory.updateAvailability);
router.patch('/inventory/:id', ...dealerOnly, requireDealerKyc, inventory.patchListing);
router.delete('/inventory/:id', ...dealerOnly, requireDealerKyc, inventory.remove);

router.get('/leads/buyer', ...dealerOnly, ops.buyerLeads);
router.get('/leads/seller', ...dealerOnly, ops.sellerLeads);
router.get('/leads/finance-insurance', ...dealerOnly, ops.financeInsuranceLeads);
router.get('/leads', ...dealerOnly, portal.listLeads);
router.patch('/leads/:id/stage', ...dealerOnly, portal.updateLeadStage);
router.patch('/leads/:id/status', ...dealerOnly, portal.updateLeadStage);
router.post('/leads/:id/assign', ...dealerOnly, portal.assignLead);
router.post('/leads/:id/activity', ...dealerOnly, workspace.addLeadActivity);
router.post('/leads/:id/convert-booking', ...dealerOnly, portal.convertLeadToBooking);
router.patch('/leads/:id', ...dealerOnly, ops.updateLead);

router.get('/test-drives', ...dealerOnly, workspace.listTestDrives);
router.patch('/test-drives/:id', ...dealerOnly, workspace.updateTestDrive);
router.get('/bookings', ...dealerOnly, workspace.listBookings);
router.post('/bookings/:id/invoice', ...dealerOnly, workspace.bookingInvoice);
router.patch('/bookings/:id', ...dealerOnly, workspace.updateBooking);
router.get('/promotions', ...dealerOnly, workspace.listPromotions);
router.post('/promotions/boost', ...dealerOnly, workspace.boostPromotion);

router.get('/', dealer.listDealers);
router.get('/:id', dealer.getDealer);

module.exports = router;
