const Car = require('../models/Car');
const CarModel = require('../models/CarModel');
const Brand = require('../models/Brand');
const City = require('../models/City');
const Wishlist = require('../models/Wishlist');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { sendWhatsAppTemplate } = require('../utils/whatsapp');
const { parseJsonField, parseCarNestedFields, enrichCarForDetail, getKmCondition, resolveListingRefs } = require('../utils/carInsights');
const { listingFieldsForCreate, publicListingFilter, requiresListingModeration, syncFromListingStatus } = require('../utils/listingStatus');
const { applyLocationFilters, normalizeListingLocation, recountLocations } = require('../services/locationService');
const inventory = require('./inventoryController');
const { dispatchSafe, EVENTS } = require('../services/notifyService');
const buyerAlerts = require('../services/buyerAlertService');


const POPULATE = [
  { path: 'brand', select: 'name slug logo' },
  { path: 'model', select: 'name slug' },
  { path: 'city', select: 'name state' },
  { path: 'owner', select: 'name mobile email dealershipName role' },
];

function splitCarUploads(files = [], body = {}) {
  const imageSlots = parseJsonField(body.imageSlots, []);
  const documentSlots = parseJsonField(body.documentSlots, []);
  const mediaSlots = {};
  const listingDocuments = {};
  const images = [];
  let inspectionReport = '';
  let imgIdx = 0;
  let docIdx = 0;

  files.forEach((f) => {
    const url = `/uploads/cars/${f.filename}`;
    const isDoc = f.mimetype === 'application/pdf' || /\.pdf$/i.test(f.originalname || '');
    if (isDoc) {
      const key = documentSlots[docIdx++] || 'serviceHistory';
      listingDocuments[key] = url;
      if (!inspectionReport) inspectionReport = url;
      return;
    }
    const slot = imageSlots[imgIdx++] || 'extra';
    if (slot && slot !== 'extra') mediaSlots[slot] = url;
    images.push(url);
  });

  return { images, inspectionReport, mediaSlots, listingDocuments };
}

function parseBudgetSearchTerm(term) {
  const t = String(term || '')
    .toLowerCase()
    .replace(/[₹,]/g, '')
    .replace(/[–—−]/g, '-')
    .replace(/\bto\b/g, '-')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return null;
  const unit = '(lakhs|lakh|laks|lak|lacs|lac|cr|crores|crore)';
  const toRs = (n, u) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return null;
    if (String(u || '').startsWith('cr')) return Math.round(num * 10000000);
    return Math.round(num * 100000);
  };
  const under = t.match(new RegExp(`^(?:under|below|upto|up to)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}?$`));
  if (under) return { maxPrice: toRs(under[1], under[2] || 'lakh') };
  const above = t.match(new RegExp(`^(?:above|over|more than)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}?$`));
  if (above) return { minPrice: toRs(above[1], above[2] || 'lakh') };
  const range = t.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*-\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}?$`));
  if (range) return { minPrice: toRs(range[1], range[3] || 'lakh'), maxPrice: toRs(range[2], range[3] || 'lakh') };
  const single = t.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${unit}$`));
  if (single) return { maxPrice: toRs(single[1], single[2]) };
  return null;
}

// GET /api/cars — list with search, filters, sort, pagination
exports.getCars = async (req, res) => {
  try {
    const {
      search, q, brand, model, city, location, state, area, areas, fuel, transmission, bodyType, color,
      minPrice, maxPrice, minYear, maxYear, ownership, minKm, maxKm,
      status, isFeatured, isPremium, sort = '-createdAt',
      page = 1, limit = 12,
    } = req.query;

    const filter = {};
    // Public listing always stays on live published cars. Admin inventory can see every status.
    if (req.user?.role === 'admin') {
      if (status) filter.status = status;
    } else {
      Object.assign(filter, publicListingFilter());
    }

    const term = String(search || q || '').trim();
    const budgetTerm = parseBudgetSearchTerm(term);
    if (term && !budgetTerm) {
      const searchRegex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const [matchingBrands, matchingCities, matchingModels] = await Promise.all([
        Brand.find({ name: searchRegex }).select('_id'),
        City.find({ name: searchRegex }).select('_id'),
        CarModel.find({ name: searchRegex }).select('_id'),
      ]);
      filter.$or = [
        { title: searchRegex },
        { variant: searchRegex },
        { fuel: searchRegex },
        { bodyType: searchRegex },
        { transmission: searchRegex },
        { brand: { $in: matchingBrands.map((b) => b._id) } },
        { city: { $in: matchingCities.map((c) => c._id) } },
        { model: { $in: matchingModels.map((m) => m._id) } },
        { pickupLocation: searchRegex },
        { 'location.area': searchRegex },
        { 'location.city': searchRegex },
        { 'location.state': searchRegex },
      ];
    }

    async function resolveRef(Model, value) {
      if (!value) return null;
      if (/^[a-fA-F0-9]{24}$/.test(String(value))) return value;
      const doc = await Model.findOne({
        $or: [
          { name: new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          { slug: String(value).toLowerCase() },
        ],
      }).select('_id');
      return doc?._id || null;
    }

    async function resolveCityRef(value) {
      if (!value) return null;
      if (/^[a-fA-F0-9]{24}$/.test(String(value))) return value;
      const cities = await City.find({}).select('_id name slug').lean();
      const needle = String(value).toLowerCase().trim();
      const exact = cities.find((c) => String(c.name).toLowerCase() === needle || String(c.slug).toLowerCase() === needle);
      if (exact) return exact._id;
      const partial = cities
        .filter((c) => needle.includes(String(c.name).toLowerCase()) || String(c.name).toLowerCase().includes(needle))
        .sort((a, b) => String(b.name).length - String(a.name).length)[0];
      return partial?._id || null;
    }

    const brandId = await resolveRef(Brand, brand);
    const modelId = await resolveRef(CarModel, model);
    const cityId = await resolveCityRef(city || location);
    const cityIsName = city && !/^[a-fA-F0-9]{24}$/.test(String(city));
    applyLocationFilters(filter, {
      state,
      area: area || areas,
      cityName: cityIsName ? city : '',
    });
    if (brandId) filter.brand = brandId;
    if (modelId) filter.model = modelId;
    if (cityId && filter['location.city']) {
      const cityRx = filter['location.city'];
      delete filter['location.city'];
      filter.$and = [...(filter.$and || []), { $or: [{ 'location.city': cityRx }, { city: cityId }] }];
    } else if (cityId) {
      filter.city = cityId;
    }
    if (fuel) filter.fuel = fuel;
    if (transmission) filter.transmission = transmission;
    if (bodyType) filter.bodyType = bodyType;
    if (color) filter.color = color;
    if (ownership) filter.ownership = ownership;
    if (isFeatured) filter.isFeatured = true;
    if (isPremium) filter.isPremium = true;

    const priceMin = minPrice || budgetTerm?.minPrice;
    const priceMax = maxPrice || budgetTerm?.maxPrice;
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }
    if (minKm || maxKm) {
      filter.kmDriven = {};
      if (minKm) filter.kmDriven.$gte = Number(minKm);
      if (maxKm) filter.kmDriven.$lte = Number(maxKm);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [cars, total] = await Promise.all([
      Car.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(Number(limit)),
      Car.countDocuments(filter),
    ]);

    res.json({ cars, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Server error fetching cars' });
  }
};

exports.getCarById = async (req, res) => {
  try {
    const id = req.params.id;
    const car = /^[a-fA-F0-9]{24}$/.test(id)
      ? await Car.findById(id).populate(POPULATE)
      : await Car.findOne({ $or: [{ slug: id }, { title: new RegExp(`^${id}$`, 'i') }] }).populate(POPULATE);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    const isOwner = req.user && String(car.owner?._id || car.owner) === String(req.user._id);
    const isStaff = req.user?.role === 'admin';
    const live = car.status === 'approved' && !car.unpublished;
    if (!live && !isOwner && !isStaff) {
      return res.status(404).json({ message: 'Car not found' });
    }
    car.views += 1;
    await car.save();
    const DealerProfile = require('../models/DealerProfile');
    const dealerProfile = car.owner?._id
      ? await DealerProfile.findOne({ user: car.owner._id }).select('businessName contactPhone addressLine1 city state pincode geo kycVerified onboardingStatus').lean()
      : null;
    const enriched = await enrichCarForDetail(car, { dealerProfile });
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Server error fetching cars' });
  }
};

exports.getSimilarCars = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const similar = await Car.find({
    _id: { $ne: car._id }, ...publicListingFilter(),
    $or: [{ brand: car.brand }, { bodyType: car.bodyType }],
  }).limit(6).populate(POPULATE);
  res.json(similar);
};

// GET /api/cars/:id/recommended
exports.getRecommendedCars = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const band = car.price * 0.2;
  const recommended = await Car.find({
    _id: { $ne: car._id },
    ...publicListingFilter(),
    price: { $gte: car.price - band, $lte: car.price + band },
  }).limit(6).populate(POPULATE);
  res.json(recommended);
};

// GET /api/cars/:id/similar-models
exports.getSimilarModels = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const stats = await Car.aggregate([
    { $match: { ...publicListingFilter(), brand: car.brand, model: { $ne: car.model } } },
    { $group: { _id: '$model', startingPrice: { $min: '$price' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);
  const modelIds = stats.map((s) => s._id);
  const models = await CarModel.find({ _id: { $in: modelIds } });
  const byId = Object.fromEntries(models.map((m) => [m._id.toString(), m]));
  res.json(
    stats
      .filter((s) => byId[s._id.toString()])
      .map((s) => ({
        model: byId[s._id.toString()],
        startingPrice: s.startingPrice,
        count: s.count,
      }))
  );
};

// POST /api/cars — Create Car & Dispatch WhatsApp Alerts
exports.createCar = async (req, res) => {
  try {
    if (req.user.role === 'dealer') {
      const DealerProfile = require('../models/DealerProfile');
      const kyc = await DealerProfile.findOne({ user: req.user._id });
      const verified = Boolean(kyc?.kycVerified || kyc?.kycStatus === 'approved');
      if (!verified) {
        return res.status(403).json({
          message: 'Complete dealer KYC and wait for approval before listing cars',
          kycStatus: kyc?.kycStatus || 'PENDING_KYC_APPROVAL',
          kycVerified: false,
        });
      }
    }
    const { images, inspectionReport, mediaSlots, listingDocuments } = splitCarUploads(req.files || [], req.body);
    const isAdmin = req.user.role === 'admin';

    let owner = req.user._id;
    let sellerType = req.user.role === 'dealer' ? 'dealer' : 'individual';
    if (isAdmin && req.body.owner) {
      const assignedOwner = await User.findById(req.body.owner);
      if (!assignedOwner) return res.status(400).json({ message: 'Assigned owner not found' });
      owner = assignedOwner._id;
      sellerType = assignedOwner.role === 'dealer' ? 'dealer' : 'individual';
    } else if (isAdmin) {
      sellerType = 'dealer';
    }

    const payload = await resolveListingRefs(parseCarNestedFields(req.body));
    const cityDoc = payload.city ? await City.findById(payload.city).select('name state') : null;
    payload.location = await normalizeListingLocation({ ...req.body, ...payload }, cityDoc);
    const Brand = require('../models/Brand');
    const CarModel = require('../models/CarModel');
    const { estimateValue } = require('../services/integrations/valuationService');
    const [brandDoc, modelDoc] = await Promise.all([
      payload.brand ? Brand.findById(payload.brand).select('name') : null,
      payload.model ? CarModel.findById(payload.model).select('name') : null,
    ]);
    const valuation = await estimateValue({
      brandId: payload.brand,
      brandName: brandDoc?.name,
      modelId: payload.model,
      modelName: modelDoc?.name,
      variant: payload.variant,
      year: payload.year,
      kmDriven: payload.kmDriven,
      ownership: payload.ownership,
      bodyType: payload.bodyType,
      fuel: payload.fuel,
      transmission: payload.transmission,
      conditionScore: payload.conditionScore || (payload.inspectionScore ? Math.round(payload.inspectionScore / 10) : 7),
      price: payload.price,
    });
    // Listing price is the seller's choice — never blocked against the valuation
    // band. The estimated range is stored/shown as indicative info only.
    const conditionScore = Math.min(
      10,
      Math.max(1, Number(payload.conditionScore) || (payload.inspectionScore ? payload.inspectionScore / 10 : 7))
    );
    payload.inspectionScore = Math.round(conditionScore * 10);
    const incomingInsights = payload.quickInsights || {};
    const quickInsights = {
      ...incomingInsights,
      marketPriceMin: incomingInsights.marketPriceMin ?? valuation.minPrice,
      marketPriceMax: incomingInsights.marketPriceMax ?? valuation.maxPrice,
      condition: {
        ...(incomingInsights.condition || {}),
        conditionScore,
        kmCondition: getKmCondition({ ...payload, quickInsights: incomingInsights }),
      },
    };
    if (!payload.price) payload.price = valuation.estimate;
    delete payload.conditionScore;

    const car = await Car.create({
      ...payload,
      features: payload.features || [],
      quickInsights,
      rtoDetails: payload.rtoDetails || {},
      inspectionChecklist: payload.inspectionChecklist || {},
      inspectionReport: inspectionReport || payload.inspectionReport || '',
      mediaSlots: { ...(payload.mediaSlots || {}), ...mediaSlots },
      listingDocuments: { ...(payload.listingDocuments || {}), ...listingDocuments },
      images,
      owner,
      sellerType,
      ...listingFieldsForCreate({ isAdmin }),
    });

    const populatedCar = await Car.findById(car._id).populate(POPULATE);
    recountLocations().catch(() => {});

    if (!isAdmin && populatedCar.listingStatus === 'PENDING_MODERATION') {
      inventory.notifyOnCreateOrUpdate({
        title: 'New listing pending moderation',
        body: `${populatedCar.title} from ${req.user.dealershipName || req.user.name} needs approval`,
        link: '/approvals',
        meta: { carId: populatedCar._id, dealerId: owner },
      }).catch(() => {});
    }

    // WHATSAPP BROADCAST (Target Numbers: 919160415851 & 916304135959)
    if (isAdmin) {
      const targetNumbers = [
        process.env.PRIMARY_CONTACT_PHONE || '919160415851',
        process.env.SECONDARY_CONTACT_PHONE || '916304135959',
      ];

      const carImage = images[0]
        ? `${process.env.CLIENT_URL || 'https://4tyrezz.com'}${images[0]}`
        : 'https://4tyrezz.com/placeholder-car.jpg';

      targetNumbers.forEach((mobile) => {
        sendWhatsAppTemplate({
          to: mobile,
          templateName: 'new_car_alert',
          components: [
            {
              type: 'header',
              parameters: [{ type: 'image', image: { link: carImage } }],
            },
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'Valued Customer' },
                { type: 'text', text: `${populatedCar.year || ''} ${populatedCar.title || 'Car'}` },
                { type: 'text', text: `${populatedCar.price || 0}` },
                { type: 'text', text: `https://4tyrezz.com/cars/${populatedCar._id}` },
              ],
            },
          ],
        }).catch((err) => console.error(`WhatsApp dispatch failed for ${mobile}:`, err.message));
      });
    }

    if (populatedCar.status === 'approved' && !populatedCar.unpublished) {
      buyerAlerts.onListingPublished(populatedCar);
    }

    res.status(201).json(populatedCar);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ message: error.message || 'Server error creating car' });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const isOwner = car.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this listing' });
    }

    const previousPrice = Number(car.price);
    const previousStatus = car.status;
    const previousUnpublished = Boolean(car.unpublished);
    const previousAvail = car.availability;

    const { images: newImages, inspectionReport, mediaSlots, listingDocuments } = splitCarUploads(req.files || [], req.body);

    let keptExistingImages = [];
    if (req.body.existingImages !== undefined && req.body.existingImages !== null) {
      let raw = req.body.existingImages;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          keptExistingImages = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          keptExistingImages = raw.trim() ? [raw] : [];
        }
      } else if (Array.isArray(raw)) {
        keptExistingImages = raw;
      }
    } else {
      keptExistingImages = car.images;
    }

    const finalImages = [...keptExistingImages, ...newImages];

    const payload = await resolveListingRefs(parseCarNestedFields(req.body));
    const cityDoc = payload.city ? await City.findById(payload.city).select('name state') : null;
    const location = await normalizeListingLocation({ ...req.body, ...payload, pickupLocation: payload.pickupLocation }, cityDoc);
    const updateData = {
      title: payload.title,
      brand: payload.brand || null,
      model: payload.model || null,
      variant: payload.variant,
      year: payload.year,
      price: payload.price,
      fuel: payload.fuel,
      transmission: payload.transmission,
      bodyType: payload.bodyType,
      kmDriven: payload.kmDriven,
      ownership: payload.ownership,
      color: payload.color,
      city: payload.city || null,
      description: payload.description,
      owner: payload.owner || car.owner,
      images: finalImages,
      insuranceType: payload.insuranceType,
      seats: payload.seats,
      registrationYear: payload.registrationYear,
      rto: payload.rto,
      engineDisplacement: payload.engineDisplacement,
      inspectionScore: payload.inspectionScore,
      interiorColor: payload.interiorColor,
      videoUrl: payload.videoUrl,
      pickupLocation: payload.pickupLocation,
      location,
      accidentDetails: payload.accidentDetails,
      serviceHistoryLog: payload.serviceHistoryLog,
      insuranceExpiry: payload.insuranceExpiry,
      pucExpiry: payload.pucExpiry,
      availability: payload.availability,
    };

    const conditionScore = Number(payload.conditionScore);
    if (Number.isFinite(conditionScore)) {
      const score = Math.min(10, Math.max(1, conditionScore));
      updateData.inspectionScore = Math.round(score * 10);
      if (payload.quickInsights) {
        payload.quickInsights = {
          ...payload.quickInsights,
          condition: {
            ...(payload.quickInsights.condition || {}),
            conditionScore: score,
            kmCondition: getKmCondition({
              year: payload.year ?? car.year,
              kmDriven: payload.kmDriven ?? car.kmDriven,
              quickInsights: payload.quickInsights,
            }),
          },
        };
      }
    }

    if (payload.features) updateData.features = payload.features;
    if (payload.quickInsights) updateData.quickInsights = payload.quickInsights;
    if (payload.rtoDetails) updateData.rtoDetails = payload.rtoDetails;
    if (payload.inspectionChecklist) updateData.inspectionChecklist = payload.inspectionChecklist;
    if (inspectionReport) updateData.inspectionReport = inspectionReport;
    if (payload.mediaSlots || Object.keys(mediaSlots).length) {
      updateData.mediaSlots = { ...(car.mediaSlots || {}), ...(payload.mediaSlots || {}), ...mediaSlots };
    }
    if (payload.listingDocuments || Object.keys(listingDocuments).length) {
      updateData.listingDocuments = { ...(car.listingDocuments || {}), ...(payload.listingDocuments || {}), ...listingDocuments };
    }

    if (req.user.role !== 'admin') {
      if (requiresListingModeration()) {
        Object.assign(updateData, syncFromListingStatus('PENDING_MODERATION', car));
        inventory.notifyOnCreateOrUpdate({
          title: 'Listing updated — pending moderation',
          body: `${car.title} was edited and needs re-approval`,
          link: '/approvals',
          meta: { carId: car._id, dealerId: car.owner },
        }).catch(() => {});
      }
    }

    if (payload.price != null && Number(payload.price) !== Number(car.price)) {
      updateData.priceHistory = [...(car.priceHistory || []), { price: Number(payload.price), changedAt: new Date(), reason: 'listing_edit' }];
    }

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(POPULATE);

    recountLocations().catch(() => {});
    if (updatedCar) {
      if (Number(updatedCar.price) !== previousPrice) {
        buyerAlerts.onPriceChange(updatedCar, previousPrice);
      }
      const becameLive = previousStatus !== 'approved' && updatedCar.status === 'approved' && !updatedCar.unpublished;
      if (becameLive) buyerAlerts.onListingPublished(updatedCar);
      if (Boolean(updatedCar.unpublished) !== previousUnpublished || updatedCar.availability !== previousAvail || updatedCar.status === 'sold') {
        buyerAlerts.onAvailabilityChange(updatedCar, { reason: updatedCar.status === 'sold' ? 'sold' : updatedCar.availability });
      }
    }
    res.json(updatedCar);
  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({ message: error.message || 'Server error updating car' });
  }
};

exports.deleteCar = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const isOwner = car.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this listing' });
  }
  await car.deleteOne();
  recountLocations().catch(() => {});
  res.json({ success: true });
};

exports.myCars = async (req, res) => {
  const cars = await Car.find({ owner: req.user._id }).populate(POPULATE).sort('-createdAt');
  res.json(cars);
};

// ---- Wishlist ----
exports.toggleWishlist = async (req, res) => {
  const existing = await Wishlist.findOne({ user: req.user._id, car: req.params.carId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ wishlisted: false });
  }
  await Wishlist.create({ user: req.user._id, car: req.params.carId });
  res.json({ wishlisted: true });
};

exports.myWishlist = async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id }).populate({ path: 'car', populate: POPULATE });
  res.json(items.map((i) => i.car).filter(Boolean));
};
// POST /api/cars/connect-whatsapp — Send Wishlist/Car Card Details to User's WhatsApp
exports.connectCarOnWhatsApp = async (req, res) => {
  try {
    const { userName, userMobile, car } = req.body;

    const targetMobile = userMobile || process.env.SECONDARY_CONTACT_PHONE || '916304135959';
    const carUrl = `https://4tyrezz.com/cars/${car.id || car._id}`;
    const imageUrl = car.imageUrl || (car.images && car.images[0]) || 'https://4tyrezz.com/placeholder-car.jpg';

    await sendWhatsAppTemplate({
      to: targetMobile,
      templateName: 'car_inquiry_connect',
      components: [
        {
          type: 'header',
          parameters: [{ type: 'image', image: { link: imageUrl } }],
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: userName || 'Valued Customer' },
            { type: 'text', text: `${car.year || ''}` },
            { type: 'text', text: `${car.make || car.brand?.name || 'Car'}` },
            { type: 'text', text: `${car.model || car.title || ''}` },
            { type: 'text', text: `${car.price || 0}` },
            { type: 'text', text: carUrl },
          ],
        },
      ],
    });
    return res.status(200).json({ success: true, message: 'WhatsApp notification sent successfully!' });
  } catch (error) {
    console.error('WhatsApp Connect error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send WhatsApp message' });
  }
};
// ---- Leads ----
exports.createLead = async (req, res) => {
  const { carId, name, phone, message, enquiryType, source, email, action } = req.body;
  const car = await Car.findById(carId);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const type = action || enquiryType || source || 'enquiry';
  const lead = await Lead.create({
    car: carId,
    seller: car.owner,
    name,
    phone,
    email: email || '',
    message,
    enquiryType: ['call', 'whatsapp', 'enquiry', 'test_drive', 'booking', 'finance', 'insurance', 'valuation', 'other'].includes(type) ? type : 'enquiry',
    source: source || type || 'website',
    stage: 'New Lead',
    status: 'New Lead',
  });
  const inc = { enquiryCount: 1 };
  if (type === 'call') inc.phoneEnquiryCount = 1;
  if (type === 'whatsapp') inc.whatsappEnquiryCount = 1;
  await Car.findByIdAndUpdate(car._id, { $inc: inc });
  const vehicleLabel = car.title || 'a vehicle';
  await dispatchSafe({
    event: EVENTS.NEW_LEAD,
    title: 'New Lead',
    message: `${name} requested ${type.replace(/_/g, ' ')} for ${vehicleLabel}`,
    dealerId: car.owner,
    entityId: lead._id,
    meta: { leadId: lead._id, carId: car._id, enquiryType: type, soundKey: 'lead', phone },
  });
  res.status(201).json(lead);
};
exports.myLeads = async (req, res) => {
  const leads = await Lead.find({ seller: req.user._id }).populate('car', 'title price images').sort('-createdAt');
  res.json(leads);
};