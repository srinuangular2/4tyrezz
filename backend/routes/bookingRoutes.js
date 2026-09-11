const express = require('express');
const router = express.Router();
const booking = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, booking.create);
router.post('/verify-payment', protect, booking.verifyPayment);
router.get('/', protect, booking.list);
router.patch('/:id', protect, authorize('dealer', 'admin'), booking.updateStatus);
router.put('/:id', protect, authorize('dealer', 'admin'), booking.updateStatus);

module.exports = router;
