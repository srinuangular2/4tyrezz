require('dotenv').config();
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const connectDB = require('../config/db');
const User = require('../models/User');
const Brand = require('../models/Brand');
const CarModel = require('../models/CarModel');
const City = require('../models/City');
const Car = require('../models/Car');

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

async function run() {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Brand.deleteMany({}), CarModel.deleteMany({}), City.deleteMany({}), Car.deleteMany({})]);

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
  const customer = await User.create({ name: 'Ravi Kumar', mobile: '9160415851', role: 'customer', isVerified: true });

  console.log('Seeding cars...');
  const titlesUsed = new Set();
  for (let i = 0; i < 40; i++) {
    const model = rand(modelDocs);
    const brand = brandDocs.find((b) => b._id.equals(model.brand));
    const year = randInt(2015, 2024);
    const title = `${year} ${brand.name} ${model.name}`;
    await Car.create({
      title,
      brand: brand._id,
      model: model._id,
      variant: rand(['LXI', 'VXI', 'ZXI', 'Base', 'Top']),
      year,
      price: randInt(250000, 2200000),
      fuel: rand(FUELS),
      transmission: rand(TRANSMISSIONS),
      bodyType: rand(BODY_TYPES),
      kmDriven: randInt(8000, 95000),
      ownership: randInt(1, 3),
      color: rand(['White', 'Silver', 'Red', 'Black', 'Grey']),
      city: rand(cities)._id,
      images: [],
      features: [...FEATURES].sort(() => 0.5 - Math.random()).slice(0, 4),
      description: `Well maintained ${title}, single owner, all documents clear, no accident history.`,
      inspectionScore: randInt(75, 97),
      status: 'approved',
      isFeatured: Math.random() > 0.75,
      isPremium: Math.random() > 0.85,
      owner: Math.random() > 0.5 ? dealer._id : customer._id,
      sellerType: Math.random() > 0.5 ? 'dealer' : 'individual',
    });
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
      city: rand(cities)._id, images: [], features: [], description: 'Newly submitted, awaiting review.',
      status: 'pending', owner: customer._id, sellerType: 'individual',
    });
  }

  console.log('\nSeed complete.');
  console.log('Admin login   -> admin@4tyrezz.com / admin123');
  console.log('Dealer login  -> dealer@4tyrezz.com / dealer123');
  console.log('Customer OTP  -> mobile 9160415851, OTP 123456 (MOCK_OTP=true)');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
