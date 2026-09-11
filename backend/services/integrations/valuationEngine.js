/**
 * Backward-compatible wrapper. Prefer valuationService.estimateValue (async).
 */
const { estimateValue: estimateAsync, formulaEstimate } = require('./valuationService');

function estimateValue(input = {}) {
  return formulaEstimate(input);
}

module.exports = { estimateValue, estimateAsync };
