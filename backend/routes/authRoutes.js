const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/otp/request', ctrl.requestOtp);
router.post('/otp/verify', ctrl.verifyOtp);
router.post('/send-otp', ctrl.requestOtp);
router.post('/verify-otp', ctrl.verifyOtp);
router.post('/complete-profile', protect, ctrl.completeProfile);
router.post('/google', protect, ctrl.connectGoogle);
router.post('/skip-profile', protect, ctrl.skipProfile);
router.post('/login', ctrl.login);
router.post('/register', ctrl.registerCustomer);
router.post('/register-customer', ctrl.registerCustomer);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.post('/change-password', protect, ctrl.changePassword);
router.get('/verify-email', ctrl.verifyEmail);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/resend-verification', protect, ctrl.resendVerification);
router.post('/register-dealer', ctrl.registerDealer);
router.get('/me', protect, ctrl.me);

module.exports = router;
