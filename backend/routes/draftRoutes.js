const express = require('express');
const router = express.Router();
const drafts = require('../controllers/draftController');
const { protect } = require('../middleware/auth');

router.get('/:kind', protect, drafts.get);
router.put('/:kind', protect, drafts.upsert);
router.delete('/:kind', protect, drafts.remove);

module.exports = router;
