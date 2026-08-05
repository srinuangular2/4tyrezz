// Shared filter option definitions for the "Explore By" bar. Each entry maps
// a display label to the query params it applies on /cars — kept in one
// place so the header strip and any other filter UI stay consistent.
export const PRICE_RANGES = [
  ['Under ₹3 Lakh', { maxPrice: 300000 }],
  ['₹3 – 5 Lakh', { minPrice: 300000, maxPrice: 500000 }],
  ['₹5 – 8 Lakh', { minPrice: 500000, maxPrice: 800000 }],
  ['₹8 – 10 Lakh', { minPrice: 800000, maxPrice: 1000000 }],
  ['₹10 – 15 Lakh', { minPrice: 1000000, maxPrice: 1500000 }],
  ['Above ₹15 Lakh', { minPrice: 1500000 }],
];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
export const TRANSMISSIONS = ['Manual', 'Automatic'];
export const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'];
export const YEAR_RANGES = [
  ['2022 & newer', { minYear: 2022 }],
  ['2019 – 2021', { minYear: 2019, maxYear: 2021 }],
  ['2015 – 2018', { minYear: 2015, maxYear: 2018 }],
  ['Before 2015', { maxYear: 2014 }],
];
export const KM_RANGES = [
  ['Under 20,000 km', { maxKm: 20000 }],
  ['20,000 – 40,000 km', { minKm: 20000, maxKm: 40000 }],
  ['40,000 – 60,000 km', { minKm: 40000, maxKm: 60000 }],
  ['60,000 – 80,000 km', { minKm: 60000, maxKm: 80000 }],
  ['Above 80,000 km', { minKm: 80000 }],
];
export const OWNER_TYPES = [
  ['1st owner', { ownership: 1 }],
  ['2nd owner', { ownership: 2 }],
  ['3rd owner', { ownership: 3 }],
];
export const COLORS = ['White', 'Silver', 'Red', 'Black', 'Grey'];
