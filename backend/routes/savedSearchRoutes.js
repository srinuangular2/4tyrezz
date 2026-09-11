const express = require('express');
const router = express.Router();
const ss = require('../controllers/savedSearchController');
const { protect, protectCustomerRoute } = require('../middleware/auth');

const customer = [protect, protectCustomerRoute];
router.get('/', ...customer, ss.list);
router.post('/', ...customer, ss.create);
router.put('/:id', ...customer, ss.update);
router.delete('/:id', ...customer, ss.remove);

module.exports = router;
