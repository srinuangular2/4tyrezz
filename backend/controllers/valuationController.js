const Valuation = require('../models/Valuation');
const Brand = require('../models/Brand');
const CarModel = require('../models/CarModel');
const { estimateValue } = require('../services/integrations/valuationService');

async function resolveNames(body) {
  const input = { ...body };
  if (body.brand && String(body.brand).match(/^[a-f0-9]{24}$/i)) {
    const b = await Brand.findById(body.brand).select('name');
    if (b) {
      input.brandId = b._id;
      input.brandName = b.name;
    }
  } else if (body.brand) {
    input.brandName = body.brand;
  }
  if (body.model && String(body.model).match(/^[a-f0-9]{24}$/i)) {
    const m = await CarModel.findById(body.model).select('name');
    if (m) {
      input.modelId = m._id;
      input.modelName = m.name;
    }
  } else if (body.model) {
    input.modelName = body.model;
  }
  return input;
}

exports.estimate = async (req, res) => {
  try {
    const input = await resolveNames(req.body);
    const result = await estimateValue(input);
    let saved = null;
    if (req.user && Number(req.body.year) && Number(req.body.kmDriven || req.body.mileage)) {
      saved = await Valuation.create({
        user: req.user._id,
        brand: input.brandName || String(req.body.brand || ''),
        model: input.modelName || String(req.body.model || ''),
        variant: req.body.variant || '',
        year: Number(req.body.year),
        kmDriven: Number(req.body.kmDriven || req.body.mileage || 0),
        ownership: Number(req.body.ownership || req.body.ownerCount || 1),
        conditionScore: Number(req.body.conditionScore || 7),
        fuel: req.body.fuel || '',
        transmission: req.body.transmission || '',
        city: req.body.city || '',
        expectedPrice: req.body.expectedPrice || req.body.price || null,
        estimate: result.estimate,
        minPrice: result.minPrice,
        maxPrice: result.maxPrice,
        source: result.source,
        meta: { ...result.breakdown, source: result.source, comps: result.comps },
      });
    }
    res.json({ data: { ...result, id: saved?._id } });
  } catch (err) {
    console.error('Valuation estimate error:', err);
    res.status(500).json({ message: err.message || 'Could not estimate value' });
  }
};

exports.listMine = async (req, res) => {
  const data = await Valuation.find({ user: req.user._id }).sort('-createdAt').limit(50);
  res.json({ data });
};

exports.calculate = async (req, res) => {
  try {
    const input = await resolveNames({
      ...req.body,
      year: req.body.year || req.body.registrationYear,
      kmDriven: req.body.kmDriven || req.body.kilometersDriven,
      ownership: req.body.ownership || req.body.numberOfOwners,
    });
    const result = await estimateValue(input);
    let saved = null;
    if (req.user && Number(input.year) && Number(input.kmDriven || req.body.kmDriven)) {
      saved = await Valuation.create({
        user: req.user._id,
        brand: input.brandName || String(req.body.brand || ''),
        model: input.modelName || String(req.body.model || ''),
        variant: req.body.variant || '',
        year: Number(input.year || req.body.year),
        kmDriven: Number(input.kmDriven || req.body.kmDriven || 0),
        ownership: Number(input.ownership || 1),
        conditionScore: Number(req.body.conditionScore || 7),
        fuel: req.body.fuel || req.body.fuelType || '',
        transmission: req.body.transmission || '',
        city: req.body.city || '',
        estimate: result.estimate,
        minPrice: result.minPrice,
        maxPrice: result.maxPrice,
        source: result.source,
        meta: result.valuation,
      });
    }
    res.json({
      success: true,
      valuation: result.valuation,
      data: { ...result, id: saved?._id },
    });
  } catch (err) {
    console.error('Valuation calculate error:', err);
    res.status(500).json({ success: false, message: err.message || 'Could not calculate valuation' });
  }
};
