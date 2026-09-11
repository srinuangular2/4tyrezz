const express = require('express');
const router = express.Router();
const content = require('../controllers/contentController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/faqs', optionalAuth, content.listFaqs);
router.post('/faqs', protect, authorize('admin'), content.upsertFaq);
router.delete('/faqs/:id', protect, authorize('admin'), content.deleteFaq);

router.get('/testimonials', optionalAuth, content.listTestimonials);
router.post('/testimonials', protect, authorize('admin'), content.upsertTestimonial);
router.delete('/testimonials/:id', protect, authorize('admin'), content.deleteTestimonial);

router.get('/stats', optionalAuth, content.listStats);
router.post('/stats', protect, authorize('admin'), content.upsertStat);

module.exports = router;
