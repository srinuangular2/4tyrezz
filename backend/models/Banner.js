const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, default: '' }, // black heading line (same as titleLine1)
    titleLine1: { type: String, default: '' },
    titleLine2: { type: String, default: '' }, // blue heading line
    subtitle: { type: String, default: '' },
    ctaLabel: { type: String, default: 'Learn more' },
    linkType: { type: String, enum: ['car', 'url', 'none'], default: 'none' },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', default: null }, // used when linkType === 'car'
    url: { type: String, default: '' }, // used when linkType === 'url'
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
