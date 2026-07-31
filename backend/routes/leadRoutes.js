const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/carController');

router.post('/', ctrl.createLead);
router.get('/mine', protect, authorize('dealer', 'customer'), ctrl.myLeads);

module.exports = router;
