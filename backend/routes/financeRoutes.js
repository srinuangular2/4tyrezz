const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const enquiry = require('../controllers/enquiryController');

function withType(type) {
  return (req, res) => {
    req.body = { ...req.body, type };
    req.params.type = type;
    return enquiry.create(req, res);
  };
}

router.post('/apply', protect, withType('finance'));
router.post('/quote', protect, withType('insurance'));

module.exports = router;
