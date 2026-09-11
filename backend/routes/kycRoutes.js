const express = require('express');
const router = express.Router();
const kyc = require('../controllers/kycController');
const { protect, authorize } = require('../middleware/auth');
const { uploadKycDocument } = require('../middleware/upload');

router.get('/me', protect, authorize('dealer', 'admin'), kyc.getMine);
router.put('/me', protect, authorize('dealer', 'admin'), kyc.upsertMine);
router.post('/me/submit', protect, authorize('dealer', 'admin'), kyc.submitMine);
router.post('/me/documents', protect, authorize('dealer', 'admin'), uploadKycDocument.single('file'), kyc.uploadDocument);
router.delete('/me/documents/:docId', protect, authorize('dealer', 'admin'), kyc.removeDocument);

router.get('/', protect, authorize('admin'), kyc.listAll);
router.patch('/:id/review', protect, authorize('admin'), kyc.review);

module.exports = router;
