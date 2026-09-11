const express = require('express');
const router = express.Router();
const review = require('../controllers/reviewController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, review.list);
router.post('/', protect, review.create);
router.patch('/:id', protect, authorize('admin'), review.moderate);

module.exports = router;
