const router = require('express').Router();
const meta = require('../controllers/metaController');

router.get('/lookup', meta.rtoLookup);
router.post('/lookup', meta.rtoLookup);

module.exports = router;
