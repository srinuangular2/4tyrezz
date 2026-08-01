const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadCarImages } = require('../middleware/upload');
const ctrl = require('../controllers/carController');

router.get('/', ctrl.getCars);
router.get('/mine', protect, ctrl.myCars);
router.get('/:id/similar', ctrl.getSimilarCars);
router.get('/:id', ctrl.getCarById);
router.post('/', protect, authorize('customer', 'dealer', 'admin'), uploadCarImages.array('images', 12), ctrl.createCar);
router.put('/:id', protect, uploadCarImages.array('images', 12), ctrl.updateCar);
router.delete('/:id', protect, ctrl.deleteCar);

router.post('/:carId/wishlist', protect, ctrl.toggleWishlist);
router.get('/wishlist/mine', protect, ctrl.myWishlist);

module.exports = router;
