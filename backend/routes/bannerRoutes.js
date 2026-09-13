const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadBannerImage } = require('../middleware/upload');
const ctrl = require('../controllers/bannerController');

router.get('/', ctrl.listActive);
router.get('/all', protect, authorize('admin'), ctrl.listAll);
router.post('/', protect, authorize('admin'), uploadBannerImage.single('image'), ctrl.create);
router.post('/bulk', protect, authorize('admin'), uploadBannerImage.array('images', 15), ctrl.createBulk);
router.put('/reorder', protect, authorize('admin'), ctrl.reorder);
router.put('/:id', protect, authorize('admin'), uploadBannerImage.single('image'), ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

module.exports = router;
