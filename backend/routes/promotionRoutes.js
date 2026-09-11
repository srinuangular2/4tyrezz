const express = require('express');
const router = express.Router();
const promo = require('../controllers/promotionController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, promo.list);
router.post('/', protect, authorize('admin'), promo.create);
router.put('/:id', protect, authorize('admin'), promo.update);
router.delete('/:id', protect, authorize('admin'), promo.remove);

module.exports = router;
