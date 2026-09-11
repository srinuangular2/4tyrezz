const router = require('express').Router();
const ctrl = require('../controllers/locationController');

router.get('/active-cities', ctrl.activeCities);
router.get('/areas', ctrl.areas);
router.get('/autocomplete', ctrl.autocomplete);
router.get('/geocode', ctrl.geocode);

module.exports = router;
