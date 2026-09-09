const express = require('express');
const router = express.Router();
const City = require('../models/City');

// GET all cities
router.get('/', async (req, res) => {
  try {
    const cities = await City.find().sort({ createdAt: -1 });
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cities', error: error.message });
  }
});

// POST create city
router.post('/', async (req, res) => {
  try {
    const { name, state, isPopular, areas } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'City name is required' });
    }

    const city = new City({
      name,
      state,
      isPopular,
      areas: Array.isArray(areas) ? areas : [],
    });

    const savedCity = await city.save();
    res.status(201).json(savedCity);
  } catch (error) {
    res.status(500).json({ message: 'Error creating city', error: error.message });
  }
});

// PUT update city
router.put('/:id', async (req, res) => {
  try {
    const { name, state, isPopular, areas } = req.body;

    const updatedCity = await City.findByIdAndUpdate(
      req.params.id,
      {
        name,
        state,
        isPopular,
        areas: Array.isArray(areas) ? areas : [],
      },
      { new: true, runValidators: true }
    );

    if (!updatedCity) {
      return res.status(404).json({ message: 'City not found' });
    }

    res.status(200).json(updatedCity);
  } catch (error) {
    res.status(500).json({ message: 'Error updating city', error: error.message });
  }
});

// DELETE city
router.delete('/:id', async (req, res) => {
  try {
    const deletedCity = await City.findByIdAndDelete(req.params.id);
    if (!deletedCity) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.status(200).json({ message: 'City deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting city', error: error.message });
  }
});

module.exports = router;