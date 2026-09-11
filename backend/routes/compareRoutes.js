const express = require('express');
const router = express.Router();
const compare = require('../controllers/compareController');

router.get('/suggested', compare.suggested);
router.get('/', compare.compare);
router.post('/', compare.compare);

module.exports = router;
