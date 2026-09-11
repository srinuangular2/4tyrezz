const router = require('express').Router();
const { protect, protectCustomerRoute } = require('../middleware/auth');
const ctrl = require('../controllers/userController');
const portal = require('../controllers/customerPortalController');
const { uploadAvatar } = require('../middleware/upload');

router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);
router.get('/profile', protect, protectCustomerRoute, portal.getProfile);
router.put('/profile', protect, protectCustomerRoute, portal.updatePreferences);
router.put('/profile/preferences', protect, protectCustomerRoute, portal.updatePreferences);
router.post('/profile-photo', protect, protectCustomerRoute, uploadAvatar.single('photo'), portal.uploadPhoto);

module.exports = router;
