const express = require('express');
const router = express.Router();
const valuation = require('../controllers/valuationController');
const { protect } = require('../middleware/auth');

router.post('/estimate', protect, valuation.estimate);
router.post('/calculate', protect, valuation.calculate);
router.get('/mine', protect, valuation.listMine);

module.exports = router;
