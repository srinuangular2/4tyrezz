const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/otp/request', ctrl.requestOtp);
router.post('/otp/verify', ctrl.verifyOtp);
router.post('/login', ctrl.login);
router.post('/register-dealer', ctrl.registerDealer);
router.get('/me', protect, ctrl.me);

module.exports = router;
