const express = require('express');
const router = express.Router();
const enquiry = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSellPhotos } = require('../middleware/upload');

const customer = [protect];
const staff = [protect, authorize('admin', 'dealer')];

router.post('/seller', ...customer, uploadSellPhotos.array('photos', 8), enquiry.create);
router.post('/', ...customer, enquiry.create);
router.post('/:type', ...customer, enquiry.create);
router.get('/', protect, enquiry.list);
router.patch('/:id', ...staff, enquiry.update);
router.put('/:id', ...staff, enquiry.update);

module.exports = router;
