const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/carController');

router.post('/interaction', protect, ctrl.createLead);
router.post('/enquiry', protect, ctrl.createLead);
router.post('/', protect, ctrl.createLead);
router.get('/mine', protect, authorize('dealer', 'customer'), ctrl.myLeads);

module.exports = router;
