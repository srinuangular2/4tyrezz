const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'CarModel', required: true },
    variant: { type: String, default: '' },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    fuel: { type: String, enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], required: true },
    transmission: { type: String, enum: ['Manual', 'Automatic'], required: true },
    bodyType: { type: String, enum: ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'], required: true },
    kmDriven: { type: Number, required: true },
    ownership: { type: Number, default: 1 }, // 1st, 2nd, 3rd owner
    color: { type: String, default: '' },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    images: [{ type: String }],
    features: [{ type: String }],
    description: { type: String, default: '' },
    inspectionScore: { type: Number, default: null },
     // Optional "Car Overview" fields to match the reference detail-page layout.
    // All optional so existing listings created before this change stay valid.
    insuranceType: { type: String, enum: ['Comprehensive', 'Third Party', 'Expired', 'None', ''], default: '' },
    seats: { type: Number, default: null },
    registrationYear: { type: Number, default: null }, // may differ from manufacture `year`
    rto: { type: String, default: '' }, // registering authority, e.g. "Hyderabad"
    engineDisplacement: { type: Number, default: null }, // in cc
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'sold'], default: 'pending' },
    isFeatured: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerType: { type: String, enum: ['individual', 'dealer'], default: 'individual' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

carSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Car', carSchema);
