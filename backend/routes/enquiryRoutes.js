const express = require('express');
const router = express.Router();
const enquiry = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSellPhotos } = require('../middleware/upload');

const customer = [protect];
const staff = [protect, authorize('admin', 'dealer')];

router.post('/seller', ...customer, uploadSellPhotos.fields([
  { name: 'photos', maxCount: 8 },
  { name: 'front', maxCount: 1 },
  { name: 'rear', maxCount: 1 },
  { name: 'dashboard', maxCount: 1 },
  { name: 'odometer', maxCount: 1 },
  { name: 'tyres', maxCount: 1 },
  { name: 'rcCopy', maxCount: 1 },
  { name: 'insurancePolicy', maxCount: 1 },
  { name: 'serviceHistoryDoc', maxCount: 1 },
]), enquiry.create);
router.post('/seller/:id/photos', ...customer, uploadSellPhotos.array('photos', 8), enquiry.addSellerPhotos);
router.patch('/seller/:id', ...customer, enquiry.updateMine);
router.post('/', ...customer, enquiry.create);
router.post('/:type', ...customer, enquiry.create);
router.get('/', protect, enquiry.list);
router.patch('/:id', ...staff, enquiry.update);
router.put('/:id', ...staff, enquiry.update);

module.exports = router;
