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
    interiorColor: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    pickupLocation: { type: String, default: '' },
    location: {
      state: { type: String, default: '', index: true },
      city: { type: String, default: '', index: true },
      area: { type: String, default: '', index: true },
      pincode: { type: String, default: '', index: true },
      formattedAddress: { type: String, default: '' },
      coordinates: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] },
      },
    },
    availability: {
      type: String,
      enum: ['available', 'reserved', 'in_transit', 'unavailable'],
      default: 'available',
    },
    unpublished: { type: Boolean, default: false, index: true },
    listingStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_MODERATION', 'PUBLISHED', 'REJECTED', 'SOLD', 'UNPUBLISHED'],
      index: true,
    },
    moderationNotes: { type: String, default: '' },
    accidentDetails: { type: String, default: '' },
    serviceHistoryLog: { type: String, default: '' },
    insuranceExpiry: { type: String, default: '' },
    pucExpiry: { type: String, default: '' },
    enquiryCount: { type: Number, default: 0 },
    phoneEnquiryCount: { type: Number, default: 0 },
    whatsappEnquiryCount: { type: Number, default: 0 },
    priceHistory: {
      type: [
        {
          price: { type: Number, required: true },
          changedAt: { type: Date, default: Date.now },
          reason: { type: String, default: '' },
        },
      ],
      default: [],
    },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    images: [{ type: String }],
    features: [{ type: String }],
    description: { type: String, default: '' },
    inspectionScore: { type: Number, default: null },

    // Optional "Car Overview" fields to match the reference detail-page layout
    insuranceType: { type: String, enum: ['Comprehensive', 'Third Party', 'Expired', 'None', ''], default: '' },
    seats: { type: Number, default: null },
    registrationYear: { type: Number, default: null }, // may differ from manufacture `year`
    rto: { type: String, default: '' }, // registering authority, e.g. "Hyderabad"
    engineDisplacement: { type: Number, default: null }, // in cc

    // --- CARDEKHO STYLE INSIGHTS & RTO DATA ---
    quickInsights: {
      goodBuyReason: { type: String, default: '' },
      marketPriceMin: { type: Number, default: null },
      marketPriceMax: { type: Number, default: null },
      condition: {
        accidental: { type: String, default: 'No' },
        odometerTampered: { type: String, default: 'No' },
        insuranceStatus: { type: String, default: 'Valid' },
        kmCondition: { type: String, default: 'Normal' },
      },
      fitForYou: { type: String, default: '' },
      thingsToCheck: [{ type: String }],
    },

    rtoDetails: {
      rcNumber: { type: String, default: '' },
      rcStatus: { type: String, default: '' },
      registrationDate: { type: String, default: '' },
      registrationYear: { type: Number, default: null },
      rtoLocation: { type: String, default: '' },
      insuranceExpiryDate: { type: String, default: '' },
      insuranceCompany: { type: String, default: '' },
      engineCapacityCC: { type: Number, default: null },
      puccValidUpto: { type: String, default: '' },
      fitnessValidUpto: { type: String, default: '' },
      color: { type: String, default: '' },
      fuel: { type: String, default: '' },
      bodyType: { type: String, default: '' },
    },

    status: { type: String, enum: ['pending', 'approved', 'rejected', 'sold'], default: 'pending' },
    isFeatured: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    inspectionChecklist: {
      engineState: { type: String, default: '' },
      serviceHistory: { type: String, default: '' },
      tyreCondition: { type: Number, default: null },
      keyCount: { type: Number, default: null },
      accidental: { type: String, default: 'No' },
      floodDamage: { type: String, default: 'No' },
    },
    inspectionReport: { type: String, default: '' },
    mediaSlots: {
      front: { type: String, default: '' },
      rear: { type: String, default: '' },
      dashboard: { type: String, default: '' },
      odometer: { type: String, default: '' },
      tyres: { type: String, default: '' },
    },
    listingDocuments: {
      rcCopy: { type: String, default: '' },
      insurancePolicy: { type: String, default: '' },
      serviceHistory: { type: String, default: '' },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerType: { type: String, enum: ['individual', 'dealer'], default: 'individual' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

carSchema.index({ title: 'text', description: 'text' });
carSchema.index({ brand: 1, model: 1, status: 1 });
carSchema.index({ status: 1, unpublished: 1, fuel: 1, bodyType: 1 });
carSchema.index({ variant: 1, status: 1 });
carSchema.index({ 'location.city': 1, 'location.area': 1, status: 1 });
carSchema.index({ 'location.state': 1, 'location.city': 1, status: 1 });
carSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Car', carSchema);