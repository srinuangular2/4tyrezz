const router = require('express').Router();
const { protect, optionalAuth, authorize, requireDealerKyc } = require('../middleware/auth');
const { uploadCarImages } = require('../middleware/upload');
const ctrl = require('../controllers/carController');
const search = require('../controllers/searchController');
// Public Car routes
router.get('/', optionalAuth, ctrl.getCars);
router.get('/search', optionalAuth, ctrl.getCars);
router.get('/autocomplete', search.autocomplete);
router.get('/mine', protect, ctrl.myCars);
router.get('/:id/similar', ctrl.getSimilarCars);
router.get('/:id/recommended', ctrl.getRecommendedCars);
router.get('/:id/similar-models', ctrl.getSimilarModels);
// Wishlist routes (Must be defined before parameterized /:id route)
router.get('/wishlist/mine', protect, ctrl.myWishlist);
router.post('/:carId/wishlist', protect, ctrl.toggleWishlist);
// WhatsApp Connect Notification route
router.post('/connect-whatsapp', protect, ctrl.connectCarOnWhatsApp);
// Single Car operations
router.get('/:id', optionalAuth, ctrl.getCarById);
router.post('/', protect, authorize('dealer', 'admin'), requireDealerKyc, uploadCarImages.array('images', 20), ctrl.createCar);
router.put('/:id', protect, authorize('dealer', 'admin'), requireDealerKyc, uploadCarImages.array('images', 20), ctrl.updateCar);
router.delete('/:id', protect, authorize('dealer', 'admin'), ctrl.deleteCar);
module.exports = router;