const Lead = require('./Lead');

const PIPELINE_STAGES = [
  'New Lead',
  'Contacted',
  'Follow-Up Scheduled',
  'Test Drive Booked',
  'Negotiation',
  'Token Booked',
  'Sold',
  'Lost',
];

const CALL_OUTCOMES = ['Connected', 'Interested', 'Not Answering', 'Wrong Number'];
const LEAD_SOURCES = ['website', 'call', 'whatsapp', 'test_drive', 'valuation', 'finance', 'insurance', 'other'];

module.exports = Lead;
module.exports.PIPELINE_STAGES = PIPELINE_STAGES;
module.exports.CALL_OUTCOMES = CALL_OUTCOMES;
module.exports.LEAD_SOURCES = LEAD_SOURCES;
