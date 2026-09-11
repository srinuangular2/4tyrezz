const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['state', 'city', 'area'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, index: true },
    stateName: { type: String, default: '', index: true },
    cityName: { type: String, default: '', index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null, index: true },
    pincode: { type: String, default: '' },
    formattedAddress: { type: String, default: '' },
    listingCount: { type: Number, default: 0, index: true },
    source: { type: String, enum: ['listing', 'geocode', 'osm', 'manual'], default: 'listing' },
    coordinates: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

locationSchema.index({ type: 1, slug: 1, cityName: 1, stateName: 1 }, { unique: true });
locationSchema.index({ name: 1, type: 1, listingCount: -1 });
locationSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Location', locationSchema);
