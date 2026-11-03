const express = require('express');
const ctrl = require('../controllers/pdiController');
const { protect, protectAdminRoute } = require('../middleware/auth');
const { uploadPdiPhotos } = require('../middleware/upload');

const router = express.Router();
const staff = protectAdminRoute;

router.get('/meta', ctrl.meta);
router.post('/bookings', protect, ctrl.create);
router.post('/bookings/:id/confirm', protect, ctrl.confirm);
router.get('/bookings', protect, ctrl.list);
router.get('/bookings/:id', protect, ctrl.getOne);
router.patch('/bookings/:id/status', protect, staff, ctrl.updateStatus);
router.post('/bookings/:id/report', protect, staff, uploadPdiPhotos.array('photos', 8), ctrl.submitReport);

module.exports = router;
