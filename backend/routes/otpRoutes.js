const router = require('express').Router();
const { requestOtp, verifyOtp } = require('../controllers/authController');

router.post('/send', requestOtp);
router.post('/verify', verifyOtp);

module.exports = router;
