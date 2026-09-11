require('dotenv').config();
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const connectDB = require('../config/db');
const User = require('../models/User');
const Brand = require('../models/Brand');
const CarModel = require('../models/CarModel');
const City = require('../models/City');
const Car = require('../models/Car');
const Banner = require('../models/Banner');
const DealerProfile = require('../models/DealerProfile');

const BRANDS = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Brezza', 'Dzire', 'Ertiga'],
  Hyundai: ['Creta', 'i20', 'Venue', 'Verna'],
  Tata: ['Nexon', 'Punch', 'Harrier', 'Altroz'],
  Honda: ['City', 'Amaze', 'WR-V'],
  Mahindra: ['XUV700', 'Scorpio', 'Thar'],
  Toyota: ['Innova Crysta', 'Fortuner', 'Glanza'],
  Kia: ['Seltos', 'Sonet'],
};

const CITIES = [
  { name: 'Hyderabad', state: 'Telangana', isPopular: true },
  { name: 'Bengaluru', state: 'Karnataka', isPopular: true },
  { name: 'Mumbai', state: 'Maharashtra', isPopular: true },
  { name: 'Delhi NCR', state: 'Delhi', isPopular: true },
  { name: 'Chennai', state: 'Tamil Nadu', isPopular: true },
  { name: 'Warangal', state: 'Telangana', isPopular: false },
  { name: 'Pune', state: 'Maharashtra', isPopular: true },
];

const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV'];
const FEATURES = ['Power Steering', 'Power Windows', 'ABS', 'Airbags', 'Rear Camera', 'Touchscreen', 'Alloy Wheels', 'Sunroof'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const RTO_CODES = ['KA01', 'KA03', 'TS09', 'MH01', 'DL01', 'TN07'];
const INSURERS = ['ICICI Lombard', 'HDFC ERGO', 'Bajaj Allianz', 'Royal Sundaram', 'New India Assurance'];

function buildSeedCarExtras({ price, year, kmDriven, ownership, fuel, bodyType, cityName, brandName, modelName, features }) {
  const band = Math.round(price * 0.1);
  const regYear = year + randInt(0, 1);
  const age = new Date().getFullYear() - year;
  const avgKm = kmDriven / Math.max(1, age);
  const kmCondition = avgKm < 8000 ? 'Below average' : avgKm > 18000 ? 'Above average' : 'Normal';
  const rtoCode = rand(RTO_CODES);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    insuranceType: rand(['Comprehensive', 'Third Party', 'Comprehensive']),
    seats: rand([5, 5, 5, 7, 6]),
    registrationYear: regYear,
    rto: cityName,
    engineDisplacement: rand([1197, 1199, 1493, 1498, 1997, 2199, 2498]),
    quickInsights: {
      goodBuyReason: `Competitive price for a ${year} ${brandName} ${modelName} with ${ownership === 1 ? 'single-owner' : `${ownership} owner`} history in ${cityName}.`,
      marketPriceMin: price - band,
      marketPriceMax: price + band,
      condition: {
        accidental: rand(['No', 'No', 'No', 'Yes']),
        odometerTampered: 'No',
        insuranceStatus: rand(['Valid', 'Valid', 'Expired']),
        kmCondition,
      },
      fitForYou: `${bodyType} ideal for ${fuel === 'Electric' ? 'eco-friendly' : 'daily'} commutes in ${cityName}. ${ownership === 1 ? 'Single owner adds transparency to service history.' : ''}`.trim(),
      thingsToCheck: [
        `${Number(kmDriven).toLocaleString('en-IN')} km driven — check tyre tread and brake wear`,
        age >= 5 ? `${age} years old — inspect rubber seals and battery health` : 'Low age vehicle — verify service records at authorised centre',
        fuel === 'Diesel' ? 'Diesel engine — verify turbo and clutch on test drive' : 'Petrol/CNG unit — check idle smoothness and AC performance',
      ],
    },
    rtoDetails: {
      rcNumber: `${rtoCode}MG${randInt(1000, 9999)}****`,
      rcStatus: rand(['Active', 'Active', 'NOC ISSUED']),
      registrationDate: `${randInt(1, 28)}-${monthNames[randInt(0, 11)]}-${regYear}`,
      rtoLocation: `${cityName.toUpperCase()} RTO`,
      insuranceExpiryDate: `${randInt(1, 28)}-${monthNames[randInt(0, 11)]}-${year + randInt(1, 2)}`,
      insuranceCompany: rand(INSURERS),
      engineCapacityCC: rand([1197, 1498, 1997, 2199]),
      puccValidUpto: `${randInt(1, 28)}-${monthNames[randInt(0, 11)]}-${year + 1}`,
      fitnessValidUpto: `${randInt(1, 28)}-${monthNames[randInt(0, 11)]}-${year + randInt(5, 10)}`,
    },
    description: `Well-maintained ${year} ${brandName} ${modelName} in ${cityName}. ${Number(kmDriven).toLocaleString('en-IN')} km driven, ${fuel} ${rand(TRANSMISSIONS).toLowerCase()}, ${ownership === 1 ? '1st owner' : `${ownership}${ownership === 2 ? 'nd' : 'rd'} owner`}. Key features: ${features.join(', ')}. All documents verified.`,
  };
}

// Stable, freely-licensed Unsplash photos used as dummy listing imagery so
// seeded cars don't look empty. Swap for real seller photos in production —
// this is illustrative content only, not tied to any specific listing's
// actual make/model.
const STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1580414057403-c5f451f30e1c?auto=format&fit=crop&w=900&q=80',
];
const randomImages = () => {
  const count = randInt(2, 4);
  return Array.from({ length: count }, () => rand(STOCK_PHOTOS));
};

async function run() {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Brand.deleteMany({}), CarModel.deleteMany({}), City.deleteMany({}), Car.deleteMany({}), Banner.deleteMany({})]);

  console.log('Seeding cities...');
  const cities = await City.insertMany(CITIES);

  console.log('Seeding brands & models...');
  const brandDocs = [];
  const modelDocs = [];
  for (const [brandName, models] of Object.entries(BRANDS)) {
    const brand = await Brand.create({ name: brandName, slug: slugify(brandName, { lower: true }), isPopular: true });
    brandDocs.push(brand);
    for (const modelName of models) {
      const m = await CarModel.create({ name: modelName, slug: slugify(modelName, { lower: true }), brand: brand._id });
      modelDocs.push(m);
    }
  }

  console.log('Seeding users (admin, dealer, customer)...');
  const adminPass = await bcrypt.hash('admin123', 10);
  const dealerPass = await bcrypt.hash('dealer123', 10);
  const admin = await User.create({ name: 'Admin', email: 'admin@4tyrezz.com', password: adminPass, role: 'admin', isVerified: true });
  const dealer = await User.create({ name: 'Prime Motors', email: 'dealer@4tyrezz.com', password: dealerPass, role: 'dealer', dealershipName: 'Prime Motors', city: 'Hyderabad', isVerified: true });
  await DealerProfile.create({
    user: dealer._id,
    businessName: 'Prime Motors',
    businessType: 'Private Limited',
    gstNumber: '36AABCP1234A1Z5',
    panNumber: 'AABCP1234A',
    addressLine1: 'Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    contactPerson: 'Prime Motors',
    contactPhone: '9876543210',
    contactEmail: 'dealer@4tyrezz.com',
    kycStatus: 'approved',
    documents: [
      { type: 'gst_certificate', url: '/uploads/kyc/seed-gst.pdf', originalName: 'gst.pdf' },
      { type: 'pan_card', url: '/uploads/kyc/seed-pan.pdf', originalName: 'pan.pdf' },
      { type: 'address_proof', url: '/uploads/kyc/seed-address.pdf', originalName: 'address.pdf' },
    ],
    submittedAt: new Date(),
    reviewedAt: new Date(),
  });
  const customer = await User.create({ name: 'Ravi Kumar', mobile: '9160415851', role: 'customer', isVerified: true });

  console.log('Seeding cars...');
  const titlesUsed = new Set();
  const createdCars = [];
  for (let i = 0; i < 40; i++) {
    const model = rand(modelDocs);
    const brand = brandDocs.find((b) => b._id.equals(model.brand));
    const city = rand(cities);
    const year = randInt(2015, 2024);
    const title = `${year} ${brand.name} ${model.name}`;
    const price = randInt(250000, 2200000);
    const kmDriven = randInt(8000, 95000);
    const ownership = randInt(1, 3);
    const fuel = rand(FUELS);
    const transmission = rand(TRANSMISSIONS);
    const bodyType = rand(BODY_TYPES);
    const carFeatures = [...FEATURES].sort(() => 0.5 - Math.random()).slice(0, randInt(3, 6));
    const extras = buildSeedCarExtras({
      price,
      year,
      kmDriven,
      ownership,
      fuel,
      bodyType,
      cityName: city.name,
      brandName: brand.name,
      modelName: model.name,
      features: carFeatures,
    });

    const car = await Car.create({
      title,
      brand: brand._id,
      model: model._id,
      variant: rand(['LXI', 'VXI', 'ZXI', 'Base', 'Top']),
      year,
      price,
      fuel,
      transmission,
      bodyType,
      kmDriven,
      ownership,
      color: rand(['White', 'Silver', 'Red', 'Black', 'Grey']),
      city: city._id,
      images: randomImages(),
      features: carFeatures,
      description: extras.description,
      inspectionScore: randInt(75, 97),
      insuranceType: extras.insuranceType,
      seats: extras.seats,
      registrationYear: extras.registrationYear,
      rto: extras.rto,
      engineDisplacement: extras.engineDisplacement,
      quickInsights: extras.quickInsights,
      rtoDetails: extras.rtoDetails,
      status: 'approved',
      isFeatured: Math.random() > 0.75,
      isPremium: Math.random() > 0.85,
      owner: Math.random() > 0.5 ? dealer._id : customer._id,
      sellerType: Math.random() > 0.5 ? 'dealer' : 'individual',
    });
    createdCars.push(car);
  }

  // A few pending listings for the admin approvals queue
  for (let i = 0; i < 4; i++) {
    const model = rand(modelDocs);
    const brand = brandDocs.find((b) => b._id.equals(model.brand));
    const year = randInt(2016, 2023);
    await Car.create({
      title: `${year} ${brand.name} ${model.name}`,
      brand: brand._id, model: model._id, year,
      price: randInt(300000, 1500000), fuel: rand(FUELS), transmission: rand(TRANSMISSIONS),
      bodyType: rand(BODY_TYPES), kmDriven: randInt(10000, 80000), ownership: 1,
      city: rand(cities)._id, images: randomImages(), features: [], description: 'Newly submitted, awaiting review.',
      status: 'pending', owner: customer._id, sellerType: 'individual',
    });
  }

  console.log('Seeding banners...');
  const BANNER_PHOTOS = [
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80',
  ];
  await Banner.create([
    {
      image: BANNER_PHOTOS[0], title: 'Find your dream car, inspected end to end.',
      subtitle: 'Every listing passes a 15-point manual inspection before it\u2019s shown to you.',
      ctaLabel: 'Browse cars', linkType: 'url', url: '/cars', order: 0, isActive: true,
    },
    {
      image: BANNER_PHOTOS[1], title: `Featured: ${createdCars[0].title}`,
      subtitle: 'This week\u2019s top pick from our verified inventory.',
      ctaLabel: 'View this car', linkType: 'car', car: createdCars[0]._id, order: 1, isActive: true,
    },
    {
      image: BANNER_PHOTOS[2], title: 'Zero inspection fee on your first booking.',
      subtitle: 'Book a physical inspection before you buy \u2014 on us, this month only.',
      ctaLabel: 'Learn more', linkType: 'url', url: '/faqs', order: 2, isActive: true,
    },
  ]);

  console.log('\nSeed complete.');
  console.log('Admin login   -> admin@4tyrezz.com / admin123');
  console.log('Dealer login  -> dealer@4tyrezz.com / dealer123');
  console.log('Customer OTP  -> mobile 9160415851 (4-digit OTP via Msg91 / console stub)');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
