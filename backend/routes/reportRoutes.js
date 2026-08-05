const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

// Reporting works for logged-in users; if you want guests to report too,
// swap `protect` for an optional-auth middleware — not needed for the MVP.
router.post('/', protect, ctrl.create);
router.get('/', protect, authorize('admin'), ctrl.list);
router.patch('/:id/reviewed', protect, authorize('admin'), ctrl.markReviewed);

module.exports = router;
