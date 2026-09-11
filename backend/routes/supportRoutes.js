const express = require('express');
const router = express.Router();
const support = require('../controllers/supportController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const portal = require('../controllers/customerPortalController');
const { protectCustomerRoute } = require('../middleware/auth');

router.post('/', optionalAuth, support.create);
router.post('/tickets', protect, protectCustomerRoute, portal.createTicket);
router.get('/tickets', protect, protectCustomerRoute, portal.listTickets);
router.post('/tickets/:id/replies', protect, protectCustomerRoute, portal.replyTicket);
router.get('/', protect, support.list);
router.patch('/:id', protect, authorize('admin'), support.update);
router.post('/:id/reply', protect, authorize('admin'), support.reply);

module.exports = router;
