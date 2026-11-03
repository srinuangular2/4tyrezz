const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/aiController');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests, try again in a few minutes' },
});

router.post(
  '/generate-description',
  protect,
  authorize('dealer', 'admin', 'field_agent', 'executive_agent'),
  aiLimiter,
  ctrl.generateDescription
);

module.exports = router;
