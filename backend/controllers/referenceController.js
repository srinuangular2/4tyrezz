// Shared CRUD for the simple reference collections: Brand, CarModel, City.
// Kept generic to avoid duplicating near-identical controllers three times.
const slugify = require('slugify');
const Brand = require('../models/Brand');
const CarModel = require('../models/CarModel');
const City = require('../models/City');

const makeCrud = (Model, { withSlug = true, withBrandFilter = false } = {}) => ({
  list: async (req, res) => {
    const filter = {};
    if (withBrandFilter && req.query.brand) filter.brand = req.query.brand;
    const items = await Model.find(filter)
      .populate(withBrandFilter ? 'brand' : [])
      .sort('name');
    res.json(items);
  },
  create: async (req, res) => {
    const data = { ...req.body };
    if (withSlug && data.name) data.slug = slugify(data.name, { lower: true });
    if (req.file) data.logo = `/uploads/brands/${req.file.filename}`;
    const item = await Model.create(data);
    res.status(201).json(item);
  },
  update: async (req, res) => {
    const data = { ...req.body };
    if (withSlug && data.name) data.slug = slugify(data.name, { lower: true });
    if (req.file) data.logo = `/uploads/brands/${req.file.filename}`;
    const item = await Model.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  },
  remove: async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  },
});

module.exports = {
  brand: makeCrud(Brand),
  model: makeCrud(CarModel, { withSlug: true, withBrandFilter: true }),
  city: makeCrud(City, { withSlug: false }),
};
