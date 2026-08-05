const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadCarImages } = require('../middleware/upload');
const ctrl = require('../controllers/carController');

// Public Car routes
router.get('/', ctrl.getCars);
router.get('/mine', protect, ctrl.myCars);
router.get('/:id/similar', ctrl.getSimilarCars);
router.get('/:id/recommended', ctrl.getRecommendedCars);
router.get('/:id/similar-models', ctrl.getSimilarModels);

// Wishlist routes (Must be defined before parameterized /:id route)
router.get('/wishlist/mine', protect, ctrl.myWishlist);
router.post('/:carId/wishlist', protect, ctrl.toggleWishlist);

// WhatsApp Connect Notification route
router.post('/connect-whatsapp', ctrl.connectCarOnWhatsApp);

// Single Car operations
router.get('/:id', ctrl.getCarById);
router.post('/', protect, authorize('dealer', 'admin'), uploadCarImages.array('images', 12), ctrl.createCar);
router.put('/:id', protect, authorize('dealer', 'admin'), uploadCarImages.array('images', 12), ctrl.updateCar);
router.delete('/:id', protect, authorize('dealer', 'admin'), ctrl.deleteCar);

module.exports = router;