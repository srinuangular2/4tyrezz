const express = require('express');
const router = express.Router();
const n = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const portal = require('../controllers/customerPortalController');

router.get('/', protect, n.listMine);
router.get('/unread-counts', protect, n.unreadCounts);
router.patch('/mark-read', protect, n.markReadBulk);
router.patch('/read-all', protect, portal.markAllNotifications);
router.patch('/:id/read', protect, n.markRead);

module.exports = router;
