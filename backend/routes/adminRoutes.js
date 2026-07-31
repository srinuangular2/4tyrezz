const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', ctrl.stats);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/toggle-active', ctrl.toggleUserActive);
router.patch('/cars/:id/status', ctrl.setCarStatus);
router.patch('/cars/:id/flag', ctrl.toggleCarFlag);

module.exports = router;
