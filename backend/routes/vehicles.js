const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  listBrands,
  listYears,
  listModels,
  listFuelTransmissions,
  listVariants,
  listColors,
  refresh,
} = require('../controllers/vehicleController');

/**
 * @openapi
 * /vehicles/brands:
 *   get:
 *     tags: [Vehicles]
 *     security: []
 *     summary: Distinct brands from the Vehicle collection
 * /vehicles/models:
 *   get:
 *     tags: [Vehicles]
 *     security: []
 *     summary: Distinct models for a brand
 *     parameters:
 *       - in: query
 *         name: brand
 *         required: true
 *         schema: { type: string }
 * /vehicles/fuel-transmissions:
 *   get:
 *     tags: [Vehicles]
 *     security: []
 *     summary: Distinct fuel types and transmissions for a brand + model
 *     parameters:
 *       - in: query
 *         name: brand
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: model
 *         required: true
 *         schema: { type: string }
 * /vehicles/variants:
 *   get:
 *     tags: [Vehicles]
 *     security: []
 *     summary: Variants for brand, model, optional fuelType, transmission, search
 *     parameters:
 *       - in: query
 *         name: brand
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: model
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: fuelType
 *         schema: { type: string }
 *       - in: query
 *         name: transmission
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 */
router.get('/brands', listBrands);
router.get('/years', listYears);
router.get('/models', listModels);
router.get('/fuel-transmissions', listFuelTransmissions);
router.get('/variants', listVariants);
router.get('/colors', listColors);
router.post('/refresh', protect, authorize('admin'), refresh);

module.exports = router;
