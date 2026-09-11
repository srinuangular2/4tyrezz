const express = require('express');
const router = express.Router();
const booking = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'dealer'), booking.listCommissions);
router.get('/ledger', protect, authorize('admin'), booking.listLedger);
router.patch('/:id', protect, authorize('admin'), booking.updateCommission);
router.post('/:id/settle', protect, authorize('admin'), booking.settleCommission);
router.post('/settle-dealer', protect, authorize('admin'), booking.settleDealerCommissions);

module.exports = router;
