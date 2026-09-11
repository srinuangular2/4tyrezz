const express = require('express');
const router = express.Router();
const meta = require('../controllers/metaController');
const { protect, authorize } = require('../middleware/auth');

router.get('/car-filters', meta.carFilters);
router.get('/finance', meta.financeMeta);
router.get('/statuses', meta.statuses);
router.get('/stats', meta.publicStats);
router.get('/rto-lookup', meta.rtoLookup);
router.get('/permissions', protect, authorize('admin'), meta.permissionsCatalog);

module.exports = router;
