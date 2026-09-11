/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     security: []
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 * /meta/car-filters:
 *   get:
 *     tags: [Meta]
 *     security: []
 *     summary: Server-driven filter enums for listings
 *     responses:
 *       200:
 *         description: Filter options
 * /meta/finance:
 *   get:
 *     tags: [Meta]
 *     security: []
 *     summary: EMI / finance rate defaults
 * /meta/statuses:
 *   get:
 *     tags: [Meta]
 *     security: []
 *     summary: Lead, booking, test-drive status enums
 * /meta/stats:
 *   get:
 *     tags: [Meta]
 *     security: []
 *     summary: Public homepage KPI stats (from CMS or live aggregates)
 */
const Car = require('../models/Car');
const User = require('../models/User');
const { SiteStat } = require('../models/Content');
const { PIPELINE_STAGES, CALL_OUTCOMES, LEAD_SOURCES } = require('../models/LeadCRM');
const { LISTING_STATUSES } = require('../models/VehicleListing');
const { BUSINESS_TYPES, KYC_STATUSES } = require('../models/DealerProfile');
const { publicListingFilter } = require('../utils/listingStatus');

exports.carFilters = async (_req, res) => {
  const live = publicListingFilter();
  const [minDoc] = await Car.find(live).sort({ price: 1 }).limit(1).select('price').lean();
  const [maxDoc] = await Car.find(live).sort({ price: -1 }).limit(1).select('price').lean();
  res.json({
    fuels: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'],
    transmissions: ['Manual', 'Automatic'],
    bodyTypes: ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'],
    ownerships: [1, 2, 3, 4],
    colors: ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Brown', 'Other'],
    budgets: [
      { label: 'Under ₹3 Lakh', max: 300000 },
      { label: '₹3 – ₹5 Lakh', min: 300000, max: 500000 },
      { label: '₹5 – ₹10 Lakh', min: 500000, max: 1000000 },
      { label: '₹10 – ₹20 Lakh', min: 1000000, max: 2000000 },
      { label: 'Above ₹20 Lakh', min: 2000000 },
    ],
    priceRange: {
      min: minDoc?.price ?? null,
      max: maxDoc?.price ?? null,
    },
    sortOptions: [
      { value: 'recommended', label: 'Recommended' },
      { value: 'price_asc', label: 'Price: low to high' },
      { value: 'price_desc', label: 'Price: high to low' },
      { value: 'newest', label: 'Newest listings' },
      { value: 'km_asc', label: 'Lowest kilometres' },
      { value: 'updated', label: 'Recently updated' },
    ],
  });
};

exports.financeMeta = async (_req, res) => {
  res.json({
    defaultInterestRate: Number(process.env.FINANCE_DEFAULT_RATE || 10.5),
    defaultTenureMonths: Number(process.env.FINANCE_DEFAULT_TENURE || 60),
    minDownPaymentPercent: Number(process.env.FINANCE_MIN_DOWN || 10),
    currency: 'INR',
  });
};

exports.statuses = async (_req, res) => {
  res.json({
    leads: PIPELINE_STAGES,
    leadSources: LEAD_SOURCES,
    callOutcomes: CALL_OUTCOMES,
    testDrives: ['Requested', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled'],
    bookings: ['Requested', 'Confirmed', 'Payment Pending', 'Booked', 'Token Received', 'Financing Pending', 'Fully Paid', 'Cancelled', 'Completed', 'Refunded'],
    payments: ['created', 'pending', 'paid', 'failed', 'refunded'],
    commissions: ['pending', 'approved', 'paid', 'cancelled'],
    kyc: KYC_STATUSES,
    businessTypes: BUSINESS_TYPES,
    listingStatuses: LISTING_STATUSES,
    carStatus: ['pending', 'approved', 'rejected', 'sold'],
    availability: ['available', 'reserved', 'in_transit', 'unavailable'],
    ticketCategories: ['general', 'listing', 'payment', 'kyc', 'technical', 'complaint'],
    ticketStatuses: ['open', 'in_progress', 'resolved', 'closed'],
    enquiryStatuses: ['Submitted', 'Dealer Responded', 'Closed'],
    financeStatuses: ['Under Review', 'Pre-Approved', 'Documents Required', 'Disbursed'],
    driveStatuses: ['Pending Confirmation', 'Confirmed', 'Completed', 'Cancelled'],
  });
};

exports.publicStats = async (_req, res) => {
  const cms = await SiteStat.find({ isActive: true }).sort('sortOrder').lean();
  if (cms.length) {
    return res.json({ data: cms, source: 'cms' });
  }

  const [cars, dealers, cities] = await Promise.all([
    Car.countDocuments(publicListingFilter()),
    User.countDocuments({ role: 'dealer', isActive: true }),
    Car.distinct('city', publicListingFilter()),
  ]);

  const data = [
    { key: 'cars', label: 'Verified cars', value: String(cars), sortOrder: 1, isActive: true },
    { key: 'dealers', label: 'Verified dealers', value: String(dealers), sortOrder: 2, isActive: true },
    { key: 'cities', label: 'Cities', value: String(cities.length), sortOrder: 3, isActive: true },
  ];
  res.json({ data, source: 'live' });
};

exports.permissionsCatalog = async (_req, res) => {
  res.json({ permissions: PERMISSIONS, roles: ROLE_PERMISSIONS });
};

exports.rtoLookup = async (req, res) => {
  try {
    const { fetchVehicleDetailsByReg } = require('../services/integrations/rtoLookupService');
    const data = await fetchVehicleDetailsByReg(req.query.reg || req.body.reg);
    res.json({ data });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Could not look up registration',
      retryAfter: err.retryAfter,
    });
  }
};
