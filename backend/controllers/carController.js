// // const Car = require('../models/Car');
// // const Wishlist = require('../models/Wishlist');
// // const Lead = require('../models/Lead');
// // const User = require('../models/User');

// // const POPULATE = [
// //   { path: 'brand', select: 'name slug logo' },
// //   { path: 'model', select: 'name slug' },
// //   { path: 'city', select: 'name state' },
// //   { path: 'owner', select: 'name mobile email dealershipName role' },
// // ];

// // // GET /api/cars — list with search, filters, sort, pagination
// // exports.getCars = async (req, res) => {
// //   const {
// //     search, brand, model, city, fuel, transmission, bodyType,
// //     minPrice, maxPrice, minYear, maxYear, ownership,
// //     status, isFeatured, isPremium, sort = '-createdAt',
// //     page = 1, limit = 12,
// //   } = req.query;

// //   const filter = {};
// //   // Public listing pages only ever want approved cars; admin explicitly passes status.
// //   filter.status = status || 'approved';

// //   if (search) filter.$text = { $search: search };
// //   if (brand) filter.brand = brand;
// //   if (model) filter.model = model;
// //   if (city) filter.city = city;
// //   if (fuel) filter.fuel = fuel;
// //   if (transmission) filter.transmission = transmission;
// //   if (bodyType) filter.bodyType = bodyType;
// //   if (ownership) filter.ownership = ownership;
// //   if (isFeatured) filter.isFeatured = true;
// //   if (isPremium) filter.isPremium = true;
// //   if (minPrice || maxPrice) {
// //     filter.price = {};
// //     if (minPrice) filter.price.$gte = Number(minPrice);
// //     if (maxPrice) filter.price.$lte = Number(maxPrice);
// //   }
// //   if (minYear || maxYear) {
// //     filter.year = {};
// //     if (minYear) filter.year.$gte = Number(minYear);
// //     if (maxYear) filter.year.$lte = Number(maxYear);
// //   }

// //   const skip = (Number(page) - 1) * Number(limit);
// //   const [cars, total] = await Promise.all([
// //     Car.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(Number(limit)),
// //     Car.countDocuments(filter),
// //   ]);

// //   res.json({ cars, total, page: Number(page), pages: Math.ceil(total / limit) });
// // };

// // exports.getCarById = async (req, res) => {
// //   const car = await Car.findById(req.params.id).populate(POPULATE);
// //   if (!car) return res.status(404).json({ message: 'Car not found' });
// //   car.views += 1;
// //   await car.save();
// //   res.json(car);
// // };

// // exports.getSimilarCars = async (req, res) => {
// //   const car = await Car.findById(req.params.id);
// //   if (!car) return res.status(404).json({ message: 'Car not found' });
// //   const similar = await Car.find({
// //     _id: { $ne: car._id }, status: 'approved',
// //     $or: [{ brand: car.brand }, { bodyType: car.bodyType }],
// //   }).limit(6).populate(POPULATE);
// //   res.json(similar);
// // };

// // exports.createCar = async (req, res) => {
// //   const images = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);
// //   const isAdmin = req.user.role === 'admin';

// //   // Admins can create a listing on behalf of a dealer/customer via `owner`
// //   // in the payload; everyone else can only create their own listing.
// //   let owner = req.user._id;
// //   let sellerType = req.user.role === 'dealer' ? 'dealer' : 'individual';
// //   if (isAdmin && req.body.owner) {
// //     const assignedOwner = await User.findById(req.body.owner);
// //     if (!assignedOwner) return res.status(400).json({ message: 'Assigned owner not found' });
// //     owner = assignedOwner._id;
// //     sellerType = assignedOwner.role === 'dealer' ? 'dealer' : 'individual';
// //   } else if (isAdmin) {
// //     sellerType = 'dealer';
// //   }

// //   const car = await Car.create({
// //     ...req.body,
// //     features: req.body.features ? JSON.parse(req.body.features) : [],
// //     images,
// //     owner,
// //     sellerType,
// //     // Admin-created listings go live immediately; everyone else's still need review.
// //     status: isAdmin ? 'approved' : 'pending',
// //   });
// //   res.status(201).json(car);
// // };


// // exports.updateCar = async (req, res) => {
// //   try {
// //     const car = await Car.findById(req.params.id);
// //     if (!car) return res.status(404).json({ message: 'Car not found' });

// //     const isOwner = car.owner.toString() === req.user._id.toString();
// //     if (!isOwner && req.user.role !== 'admin') {
// //       return res.status(403).json({ message: 'Not authorized to edit this listing' });
// //     }

// //     // 1. Collect newly uploaded files
// //     const newImages = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);

// //     // 2. Parse kept existing images from request body
// //     let keptExistingImages = [];
    
// //     if (req.body.existingImages !== undefined && req.body.existingImages !== null) {
// //       let raw = req.body.existingImages;
      
// //       if (typeof raw === 'string') {
// //         try {
// //           // Parse JSON string array sent from frontend
// //           const parsed = JSON.parse(raw);
// //           keptExistingImages = Array.isArray(parsed) ? parsed : [parsed];
// //         } catch (e) {
// //           // If it's a plain path string (e.g., when only 1 image remains)
// //           keptExistingImages = raw.trim() ? [raw] : [];
// //         }
// //       } else if (Array.isArray(raw)) {
// //         keptExistingImages = raw;
// //       }
// //     } else {
// //       // ONLY fallback to original images if existingImages key was NOT sent at all
// //       keptExistingImages = car.images;
// //     }

// //     // Combine remaining existing images with newly uploaded images
// //     const finalImages = [...keptExistingImages, ...newImages];

// //     // 3. Prepare update document
// //     const updateData = {
// //       title: req.body.title,
// //       brand: req.body.brand || null,
// //       model: req.body.model || null,
// //       variant: req.body.variant,
// //       year: req.body.year,
// //       price: req.body.price,
// //       fuel: req.body.fuel,
// //       transmission: req.body.transmission,
// //       bodyType: req.body.bodyType,
// //       kmDriven: req.body.kmDriven,
// //       ownership: req.body.ownership,
// //       color: req.body.color,
// //       city: req.body.city || null,
// //       description: req.body.description,
// //       owner: req.body.owner || car.owner,
// //       images: finalImages, // Completely overrides the images array in MongoDB
// //     };

// //     if (req.body.features) {
// //       try {
// //         updateData.features = JSON.parse(req.body.features);
// //       } catch (e) {
// //         updateData.features = [];
// //       }
// //     }

// //     if (req.user.role !== 'admin') {
// //       updateData.status = 'pending';
// //     }

// //     // Debugging output in server console
// //     console.log('=== UPDATE CAR IMAGES DEBUG ===');
// //     console.log('Received raw existingImages:', req.body.existingImages);
// //     console.log('Parsed kept images count:', keptExistingImages.length);
// //     console.log('New uploads count:', newImages.length);
// //     console.log('Saving final images count:', finalImages.length);

// //     // 4. Force MongoDB update
// //     const updatedCar = await Car.findByIdAndUpdate(
// //       req.params.id,
// //       { $set: updateData },
// //       { new: true, runValidators: true }
// //     ).populate(POPULATE);

// //     res.json(updatedCar);
// //   } catch (error) {
// //     console.error('Update car error:', error);
// //     res.status(500).json({ message: error.message || 'Server error updating car' });
// //   }
// // };


// // exports.deleteCar = async (req, res) => {
// //   const car = await Car.findById(req.params.id);
// //   if (!car) return res.status(404).json({ message: 'Car not found' });
// //   const isOwner = car.owner.toString() === req.user._id.toString();
// //   if (!isOwner && req.user.role !== 'admin') {
// //     return res.status(403).json({ message: 'Not authorized to delete this listing' });
// //   }
// //   await car.deleteOne();
// //   res.json({ success: true });
// // };

// // exports.myCars = async (req, res) => {
// //   const cars = await Car.find({ owner: req.user._id }).populate(POPULATE).sort('-createdAt');
// //   res.json(cars);
// // };

// // // ---- Wishlist ----
// // exports.toggleWishlist = async (req, res) => {
// //   const existing = await Wishlist.findOne({ user: req.user._id, car: req.params.carId });
// //   if (existing) {
// //     await existing.deleteOne();
// //     return res.json({ wishlisted: false });
// //   }
// //   await Wishlist.create({ user: req.user._id, car: req.params.carId });
// //   res.json({ wishlisted: true });
// // };

// // exports.myWishlist = async (req, res) => {
// //   const items = await Wishlist.find({ user: req.user._id }).populate({ path: 'car', populate: POPULATE });
// //   res.json(items.map((i) => i.car).filter(Boolean));
// // };

// // // ---- Leads ----
// // exports.createLead = async (req, res) => {
// //   const { carId, name, phone, message } = req.body;
// //   const car = await Car.findById(carId);
// //   if (!car) return res.status(404).json({ message: 'Car not found' });
// //   const lead = await Lead.create({ car: carId, seller: car.owner, name, phone, message });
// //   res.status(201).json(lead);
// // };

// // exports.myLeads = async (req, res) => {
// //   const leads = await Lead.find({ seller: req.user._id }).populate('car', 'title price images').sort('-createdAt');
// //   res.json(leads);
// // };


// const Car = require('../models/Car');
// const CarModel = require('../models/CarModel');
// const Wishlist = require('../models/Wishlist');
// const Lead = require('../models/Lead');
// const User = require('../models/User');

// const POPULATE = [
//   { path: 'brand', select: 'name slug logo' },
//   { path: 'model', select: 'name slug' },
//   { path: 'city', select: 'name state' },
//   { path: 'owner', select: 'name mobile email dealershipName role' },
// ];

// // GET /api/cars — list with search, filters, sort, pagination
// exports.getCars = async (req, res) => {
//   const {
//     search, brand, model, city, fuel, transmission, bodyType, color,
//     minPrice, maxPrice, minYear, maxYear, ownership, minKm, maxKm,
//     status, isFeatured, isPremium, sort = '-createdAt',
//     page = 1, limit = 12,
//   } = req.query;

//   const filter = {};
//   // Public listing pages only ever want approved cars; admin explicitly passes status.
//   filter.status = status || 'approved';

//   if (search) filter.$text = { $search: search };
//   if (brand) filter.brand = brand;
//   if (model) filter.model = model;
//   if (city) filter.city = city;
//   if (fuel) filter.fuel = fuel;
//   if (transmission) filter.transmission = transmission;
//   if (bodyType) filter.bodyType = bodyType;
//   if (color) filter.color = color;
//   if (ownership) filter.ownership = ownership;
//   if (isFeatured) filter.isFeatured = true;
//   if (isPremium) filter.isPremium = true;

//   if (minPrice || maxPrice) {
//     filter.price = {};
//     if (minPrice) filter.price.$gte = Number(minPrice);
//     if (maxPrice) filter.price.$lte = Number(maxPrice);
//   }
//   if (minYear || maxYear) {
//     filter.year = {};
//     if (minYear) filter.year.$gte = Number(minYear);
//     if (maxYear) filter.year.$lte = Number(maxYear);
//   }
//   if (minKm || maxKm) {
//     filter.kmDriven = {};
//     if (minKm) filter.kmDriven.$gte = Number(minKm);
//     if (maxKm) filter.kmDriven.$lte = Number(maxKm);
//   }

//   const skip = (Number(page) - 1) * Number(limit);
//   const [cars, total] = await Promise.all([
//     Car.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(Number(limit)),
//     Car.countDocuments(filter),
//   ]);

//   res.json({ cars, total, page: Number(page), pages: Math.ceil(total / limit) });
// };

// exports.getCarById = async (req, res) => {
//   const car = await Car.findById(req.params.id).populate(POPULATE);
//   if (!car) return res.status(404).json({ message: 'Car not found' });
//   car.views += 1;
//   await car.save();
//   res.json(car);
// };

// exports.getSimilarCars = async (req, res) => {
//   const car = await Car.findById(req.params.id);
//   if (!car) return res.status(404).json({ message: 'Car not found' });
//   const similar = await Car.find({
//     _id: { $ne: car._id }, status: 'approved',
//     $or: [{ brand: car.brand }, { bodyType: car.bodyType }],
//   }).limit(6).populate(POPULATE);
//   res.json(similar);
// };



// // GET /api/cars/:id/recommended — cars in a similar price band, distinct
// // from the "similar" set (which matches on brand/body type instead).
// // Mirrors CarDekho's "Recommended Cars" strip on the detail page.
// exports.getRecommendedCars = async (req, res) => {
//   const car = await Car.findById(req.params.id);
//   if (!car) return res.status(404).json({ message: 'Car not found' });
//   const band = car.price * 0.2;
//   const recommended = await Car.find({
//     _id: { $ne: car._id },
//     status: 'approved',
//     price: { $gte: car.price - band, $lte: car.price + band },
//   }).limit(6).populate(POPULATE);
//   res.json(recommended);
// };
// // GET /api/cars/:id/similar-models — other models from the same brand, with
// // a starting price and available-car count, like CarDekho's "Similar Car
// // Models" strip (e.g. "Maruti Suzuki Dzire — Starting @ ₹3.31 Lakh — 21 cars").
// exports.getSimilarModels = async (req, res) => {
//   const car = await Car.findById(req.params.id);
//   if (!car) return res.status(404).json({ message: 'Car not found' });
//   const stats = await Car.aggregate([
//     { $match: { status: 'approved', brand: car.brand, model: { $ne: car.model } } },
//     { $group: { _id: '$model', startingPrice: { $min: '$price' }, count: { $sum: 1 } } },
//     { $sort: { count: -1 } },
//     { $limit: 6 },
//   ]);
//   const modelIds = stats.map((s) => s._id);
//   const models = await CarModel.find({ _id: { $in: modelIds } });
//   const byId = Object.fromEntries(models.map((m) => [m._id.toString(), m]));
//   res.json(
//     stats
//       .filter((s) => byId[s._id.toString()])
//       .map((s) => ({
//         model: byId[s._id.toString()],
//         startingPrice: s.startingPrice,
//         count: s.count,
//       }))
//   );
// };




// exports.createCar = async (req, res) => {
//   const images = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);
//   const isAdmin = req.user.role === 'admin';

//   // Admins can create a listing on behalf of a dealer/customer via `owner`
//   // in the payload; everyone else can only create their own listing.
//   let owner = req.user._id;
//   let sellerType = req.user.role === 'dealer' ? 'dealer' : 'individual';
//   if (isAdmin && req.body.owner) {
//     const assignedOwner = await User.findById(req.body.owner);
//     if (!assignedOwner) return res.status(400).json({ message: 'Assigned owner not found' });
//     owner = assignedOwner._id;
//     sellerType = assignedOwner.role === 'dealer' ? 'dealer' : 'individual';
//   } else if (isAdmin) {
//     sellerType = 'dealer';
//   }

//   const car = await Car.create({
//     ...req.body,
//     features: req.body.features ? JSON.parse(req.body.features) : [],
//     images,
//     owner,
//     sellerType,
//     // Admin-created listings go live immediately; everyone else's still need review.
//     status: isAdmin ? 'approved' : 'pending',
//   });
//   res.status(201).json(car);
// };

// exports.updateCar = async (req, res) => {
//   try {
//     const car = await Car.findById(req.params.id);
//     if (!car) return res.status(404).json({ message: 'Car not found' });

//     const isOwner = car.owner.toString() === req.user._id.toString();
//     if (!isOwner && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to edit this listing' });
//     }

//     // 1. Collect newly uploaded files
//     const newImages = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);

//     // 2. Parse kept existing images from request body
//     let keptExistingImages = [];
    
//     if (req.body.existingImages !== undefined && req.body.existingImages !== null) {
//       let raw = req.body.existingImages;
      
//       if (typeof raw === 'string') {
//         try {
//           // Parse JSON string array sent from frontend
//           const parsed = JSON.parse(raw);
//           keptExistingImages = Array.isArray(parsed) ? parsed : [parsed];
//         } catch (e) {
//           // If it's a plain path string (e.g., when only 1 image remains)
//           keptExistingImages = raw.trim() ? [raw] : [];
//         }
//       } else if (Array.isArray(raw)) {
//         keptExistingImages = raw;
//       }
//     } else {
//       // ONLY fallback to original images if existingImages key was NOT sent at all
//       keptExistingImages = car.images;
//     }

//     // Combine remaining existing images with newly uploaded images
//     const finalImages = [...keptExistingImages, ...newImages];

//     // 3. Prepare update document
//     const updateData = {
//       title: req.body.title,
//       brand: req.body.brand || null,
//       model: req.body.model || null,
//       variant: req.body.variant,
//       year: req.body.year,
//       price: req.body.price,
//       fuel: req.body.fuel,
//       transmission: req.body.transmission,
//       bodyType: req.body.bodyType,
//       kmDriven: req.body.kmDriven,
//       ownership: req.body.ownership,
//       color: req.body.color,
//       city: req.body.city || null,
//       description: req.body.description,
//       owner: req.body.owner || car.owner,
//       images: finalImages, // Completely overrides the images array in MongoDB
//       // Car Overview fields added for the CarDekho-style detail page —
//       // all optional, so existing listings without them still work fine.
//       insuranceType: req.body.insuranceType,
//       seats: req.body.seats,
//       registrationYear: req.body.registrationYear,
//       rto: req.body.rto,
//       engineDisplacement: req.body.engineDisplacement,
      
//     };

//     if (req.body.features) {
//       try {
//         updateData.features = JSON.parse(req.body.features);
//       } catch (e) {
//         updateData.features = [];
//       }
//     }

//     // Re-approval workflow for non-admins
//     if (req.user.role !== 'admin') {
//       updateData.status = 'pending';
//     }

//     // Debugging output in server console
//     console.log('=== UPDATE CAR IMAGES DEBUG ===');
//     console.log('Received raw existingImages:', req.body.existingImages);
//     console.log('Parsed kept images count:', keptExistingImages.length);
//     console.log('New uploads count:', newImages.length);
//     console.log('Saving final images count:', finalImages.length);

//     // 4. Force MongoDB update
//     const updatedCar = await Car.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     ).populate(POPULATE);

//     res.json(updatedCar);
//   } catch (error) {
//     console.error('Update car error:', error);
//     res.status(500).json({ message: error.message || 'Server error updating car' });
//   }
// };

// exports.deleteCar = async (req, res) => {
//   const car = await Car.findById(req.params.id);
//   if (!car) return res.status(404).json({ message: 'Car not found' });
//   const isOwner = car.owner.toString() === req.user._id.toString();
//   if (!isOwner && req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Not authorized to delete this listing' });
//   }
//   await car.deleteOne();
//   res.json({ success: true });
// };

// exports.myCars = async (req, res) => {
//   const cars = await Car.find({ owner: req.user._id }).populate(POPULATE).sort('-createdAt');
//   res.json(cars);
// };

// // ---- Wishlist ----
// exports.toggleWishlist = async (req, res) => {
//   const existing = await Wishlist.findOne({ user: req.user._id, car: req.params.carId });
//   if (existing) {
//     await existing.deleteOne();
//     return res.json({ wishlisted: false });
//   }
//   await Wishlist.create({ user: req.user._id, car: req.params.carId });
//   res.json({ wishlisted: true });
// };

// exports.myWishlist = async (req, res) => {
//   const items = await Wishlist.find({ user: req.user._id }).populate({ path: 'car', populate: POPULATE });
//   res.json(items.map((i) => i.car).filter(Boolean));
// };

// // ---- Leads ----
// exports.createLead = async (req, res) => {
//   const { carId, name, phone, message } = req.body;
//   const car = await Car.findById(carId);
//   if (!car) return res.status(404).json({ message: 'Car not found' });
//   const lead = await Lead.create({ car: carId, seller: car.owner, name, phone, message });
//   res.status(201).json(lead);
// };

// exports.myLeads = async (req, res) => {
//   const leads = await Lead.find({ seller: req.user._id }).populate('car', 'title price images').sort('-createdAt');
//   res.json(leads);
// };



const Car = require('../models/Car');
const CarModel = require('../models/CarModel');
const Brand = require('../models/Brand');
const City = require('../models/City');
const Wishlist = require('../models/Wishlist');
const Lead = require('../models/Lead');
const User = require('../models/User');

const POPULATE = [
  { path: 'brand', select: 'name slug logo' },
  { path: 'model', select: 'name slug' },
  { path: 'city', select: 'name state' },
  { path: 'owner', select: 'name mobile email dealershipName role' },
];

// GET /api/cars — list with search, filters, sort, pagination
exports.getCars = async (req, res) => {
  try {
    const {
      search, brand, model, city, fuel, transmission, bodyType, color,
      minPrice, maxPrice, minYear, maxYear, ownership, minKm, maxKm,
      status, isFeatured, isPremium, sort = '-createdAt',
      page = 1, limit = 12,
    } = req.query;

    const filter = {};
    // Public listing pages only ever want approved cars; admin explicitly passes status.
    filter.status = status || 'approved';

    // MULTI-FIELD SEARCH LOGIC (Title, Model, Brand Name, City Name)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // Find matching Brand and City ObjectIDs based on the text string
      const [matchingBrands, matchingCities] = await Promise.all([
        Brand.find({ name: searchRegex }).select('_id'),
        City.find({ name: searchRegex }).select('_id'),
      ]);

      filter.$or = [
        { title: searchRegex },
        { variant: searchRegex },
        { brand: { $in: matchingBrands.map((b) => b._id) } },
        { city: { $in: matchingCities.map((c) => c._id) } },
      ];
    }

    if (brand) filter.brand = brand;
    if (model) filter.model = model;
    if (city) filter.city = city;
    if (fuel) filter.fuel = fuel;
    if (transmission) filter.transmission = transmission;
    if (bodyType) filter.bodyType = bodyType;
    if (color) filter.color = color;
    if (ownership) filter.ownership = ownership;
    if (isFeatured) filter.isFeatured = true;
    if (isPremium) filter.isPremium = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
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
  const car = await Car.findById(req.params.id).populate(POPULATE);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  car.views += 1;
  await car.save();
  res.json(car);
};

exports.getSimilarCars = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const similar = await Car.find({
    _id: { $ne: car._id }, status: 'approved',
    $or: [{ brand: car.brand }, { bodyType: car.bodyType }],
  }).limit(6).populate(POPULATE);
  res.json(similar);
};

// GET /api/cars/:id/recommended — cars in a similar price band, distinct
// from the "similar" set (which matches on brand/body type instead).
// Mirrors CarDekho's "Recommended Cars" strip on the detail page.
exports.getRecommendedCars = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const band = car.price * 0.2;
  const recommended = await Car.find({
    _id: { $ne: car._id },
    status: 'approved',
    price: { $gte: car.price - band, $lte: car.price + band },
  }).limit(6).populate(POPULATE);
  res.json(recommended);
};

// GET /api/cars/:id/similar-models — other models from the same brand, with
// a starting price and available-car count, like CarDekho's "Similar Car
// Models" strip (e.g. "Maruti Suzuki Dzire — Starting @ ₹3.31 Lakh — 21 cars").
exports.getSimilarModels = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const stats = await Car.aggregate([
    { $match: { status: 'approved', brand: car.brand, model: { $ne: car.model } } },
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

exports.createCar = async (req, res) => {
  const images = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);
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

  const car = await Car.create({
    ...req.body,
    features: req.body.features ? JSON.parse(req.body.features) : [],
    images,
    owner,
    sellerType,
    status: isAdmin ? 'approved' : 'pending',
  });
  res.status(201).json(car);
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const isOwner = car.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this listing' });
    }

    const newImages = (req.files || []).map((f) => `/uploads/cars/${f.filename}`);

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

    const updateData = {
      title: req.body.title,
      brand: req.body.brand || null,
      model: req.body.model || null,
      variant: req.body.variant,
      year: req.body.year,
      price: req.body.price,
      fuel: req.body.fuel,
      transmission: req.body.transmission,
      bodyType: req.body.bodyType,
      kmDriven: req.body.kmDriven,
      ownership: req.body.ownership,
      color: req.body.color,
      city: req.body.city || null,
      description: req.body.description,
      owner: req.body.owner || car.owner,
      images: finalImages,
      insuranceType: req.body.insuranceType,
      seats: req.body.seats,
      registrationYear: req.body.registrationYear,
      rto: req.body.rto,
      engineDisplacement: req.body.engineDisplacement,
    };

    if (req.body.features) {
      try {
        updateData.features = JSON.parse(req.body.features);
      } catch (e) {
        updateData.features = [];
      }
    }

    if (req.user.role !== 'admin') {
      updateData.status = 'pending';
    }

    console.log('=== UPDATE CAR IMAGES DEBUG ===');
    console.log('Received raw existingImages:', req.body.existingImages);
    console.log('Parsed kept images count:', keptExistingImages.length);
    console.log('New uploads count:', newImages.length);
    console.log('Saving final images count:', finalImages.length);

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(POPULATE);

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

// ---- Leads ----
exports.createLead = async (req, res) => {
  const { carId, name, phone, message } = req.body;
  const car = await Car.findById(carId);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  const lead = await Lead.create({ car: carId, seller: car.owner, name, phone, message });
  res.status(201).json(lead);
};

exports.myLeads = async (req, res) => {
  const leads = await Lead.find({ seller: req.user._id }).populate('car', 'title price images').sort('-createdAt');
  res.json(leads);
};