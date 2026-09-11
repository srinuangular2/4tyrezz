const express = require('express');
const router = express.Router();
const booking = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'dealer', 'customer'), booking.listPayments);

module.exports = router;
