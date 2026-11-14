const express = require('express');
const router = express.Router();
const booking = require('../controllers/bookingController');
const payment = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPaymentReceipt } = require('../middleware/upload');

router.get('/checkout-config', payment.checkoutConfig);
router.post('/create-order', protect, payment.createOrder);
router.post('/verify-signature', protect, payment.verifySignature);
router.post('/bank-transfer', protect, (req, res, next) => {
  uploadPaymentReceipt.single('receipt')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Receipt upload failed' });
    return payment.bankTransfer(req, res, next);
  });
});
router.get('/', protect, authorize('admin', 'dealer', 'customer'), booking.listPayments);

module.exports = router;
