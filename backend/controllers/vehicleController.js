const vehicleData = require('../services/vehicleDataService');

const listBrands = async (_req, res) => {
  try {
    const brands = await vehicleData.listBrands();
    res.json({ success: true, data: brands });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not list brands' });
  }
};

const listYears = async (req, res) => {
  try {
    if (!req.query.brand) return res.status(400).json({ message: 'brand query is required' });
    const years = await vehicleData.listYears(req.query.brand);
    res.json({ success: true, data: years });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not list years' });
  }
};

const listModels = async (req, res) => {
  try {
    if (!req.query.brand) return res.status(400).json({ message: 'brand query is required' });
    const models = await vehicleData.listModels(req.query.brand, req.query.year);
    res.json({ success: true, data: models });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not list models' });
  }
};

const listFuelTransmissions = async (req, res) => {
  try {
    const { brand, model, year } = req.query;
    if (!brand || !model) {
      return res.status(400).json({ message: 'brand and model query params are required' });
    }
    const data = await vehicleData.listFuelTransmissions(brand, model, year);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not list fuel and transmissions' });
  }
};

const listVariants = async (req, res) => {
  try {
    const { brand, model, fuelType, fuel, transmission, trans, search } = req.query;
    if (!brand || !model) {
      return res.status(400).json({ message: 'brand and model query params are required' });
    }
    const data = await vehicleData.listVariants({
      brand,
      model,
      fuelType: fuelType || fuel,
      transmission: transmission || trans,
      search,
      year: req.query.year,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not list variants' });
  }
};

const listColors = async (req, res) => {
  try {
    const { colorsFor } = require('../data/modelColors');
    const data = colorsFor(req.query.brand, req.query.model);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not list colours' });
  }
};

const refresh = async (_req, res) => {
  try {
    const stats = await vehicleData.ingestCatalog({ force: true });
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Catalog refresh failed' });
  }
};

module.exports = { listBrands, listYears, listModels, listFuelTransmissions, listVariants, listColors, refresh };
