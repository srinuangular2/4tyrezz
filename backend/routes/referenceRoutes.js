const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadBrandLogo } = require('../middleware/upload');
const { brand, model, city } = require('../controllers/referenceController');

const adminOnly = [protect, authorize('admin')];

router.get('/brands', brand.list);
router.post('/brands', adminOnly, uploadBrandLogo.single('logo'), brand.create);
router.put('/brands/:id', adminOnly, uploadBrandLogo.single('logo'), brand.update);
router.delete('/brands/:id', adminOnly, brand.remove);

router.get('/models', model.list);
router.post('/models', adminOnly, model.create);
router.put('/models/:id', adminOnly, model.update);
router.delete('/models/:id', adminOnly, model.remove);

router.get('/cities', city.list);
router.post('/cities', adminOnly, city.create);
router.put('/cities/:id', adminOnly, city.update);
router.delete('/cities/:id', adminOnly, city.remove);

module.exports = router;
