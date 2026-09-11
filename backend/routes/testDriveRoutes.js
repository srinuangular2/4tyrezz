const express = require('express');
const router = express.Router();
const td = require('../controllers/testDriveController');
const { protect, authorize } = require('../middleware/auth');

router.post('/book', protect, td.create);
router.post('/', protect, td.create);
router.get('/mine', protect, td.listMine);
router.patch('/:id', protect, authorize('dealer', 'admin'), td.updateStatus);

module.exports = router;
