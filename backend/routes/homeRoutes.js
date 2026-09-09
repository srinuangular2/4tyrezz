const express = require('express');
const router = express.Router();
const axios = require('axios');
const Car = require('../models/Car');
const Dealer = require('../models/Dealer');

// Static FAQ content for zero latency
const STATIC_FAQS = [
  {
    _id: 'faq-1',
    question: 'How are cars verified on 4TYREZZ?',
    answer: 'Every car listed undergoes a 140+ point technical inspection check covering engine performance, transmission, bodywork, and legal documentation.'
  },
  {
    _id: 'faq-2',
    question: 'Can I test drive a vehicle before purchasing?',
    answer: 'Yes! You can schedule a test drive directly with our verified partner dealers or individual sellers.'
  },
  {
    _id: 'faq-3',
    question: 'How does the car financing and loan approval work?',
    answer: 'We partner with leading banks to offer instant online approvals, lowest interest rates, and quick disbursal.'
  },
  {
    _id: 'faq-4',
    question: 'What documentation do I need to sell my car?',
    answer: 'You will need your original Registration Certificate (RC), valid insurance policy, pollution certificate (PUC), and government ID proof.'
  },
  {
    _id: 'faq-5',
    question: 'Are there any hidden listing charges for sellers?',
    answer: 'Individual sellers can list up to 2 cars completely free of charge. Dealer plans offer bulk inventory options.'
  }
];

router.get('/home-metadata', async (req, res) => {
  try {
    const fuelTypes = await Car.distinct('fuel');
    const locations = await Car.distinct('location');
    const years = await Car.distinct('year');
    const bodyTypesFromDb = await Car.distinct('bodyType');

    const budgets = [
      { label: 'Under ₹3 Lakh', max: 300000 },
      { label: '₹3 – ₹5 Lakh', min: 300000, max: 500000 },
      { label: '₹5 – ₹10 Lakh', min: 500000, max: 1000000 },
      { label: '₹10 – ₹20 Lakh', min: 1000000, max: 2000000 },
      { label: 'Above ₹20 Lakh', min: 2000000 },
    ];

    const bodyTypes = bodyTypesFromDb.length
      ? bodyTypesFromDb.map((type) => ({ name: type, icon: '🚗' }))
      : [
          { name: 'Hatchback', icon: '🚗' },
          { name: 'Sedan', icon: '🚘' },
          { name: 'SUV', icon: '🚙' },
          { name: 'MUV', icon: '🚐' }
        ];

    let dealers = await Dealer.find({ isVerified: true }).limit(6);
    if (!dealers.length) {
      dealers = await Car.distinct('dealerName').then((list) =>
        list.filter(Boolean).map((name, i) => ({
          _id: `d-${i}`,
          name,
          city: locations[i % locations.length] || 'Hyderabad',
          isVerified: true
        }))
      );
    }

    // Google Places API for real-time reviews
    let googleReviews = [];
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    if (apiKey && placeId) {
      try {
        const googleRes = await axios.get(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating&key=${apiKey}`
        );
        if (googleRes.data?.result?.reviews) {
          googleReviews = googleRes.data.result.reviews.map((r, i) => ({
            _id: `g-rev-${i}`,
            name: r.author_name,
            avatar: r.profile_photo_url,
            comment: r.text,
            rating: r.rating,
            time: r.relative_time_description,
          }));
        }
      } catch (err) {
        console.error('Google Reviews error:', err.message);
      }
    }

    if (!googleReviews.length) {
      googleReviews = [
        { _id: 'g-1', name: 'Srinivas Rao', comment: 'Excellent buying experience. Verified cars and completely honest pricing!', rating: 5, time: 'a week ago' },
        { _id: 'g-2', name: 'Ananya Sharma', comment: 'Sold my hatchback within 2 days. Seamless RC transfer and instant payment.', rating: 5, time: '2 weeks ago' },
        { _id: 'g-3', name: 'Vikram Reddy', comment: 'Transparent loan options and hassle-free test drive booking.', rating: 5, time: 'a month ago' }
      ];
    }

    res.status(200).json({
      budgets,
      bodyTypes,
      fuelTypes: fuelTypes.length ? fuelTypes : ['Petrol', 'Diesel', 'CNG', 'Electric'],
      locations: locations.length ? locations : ['Hyderabad', 'Bangalore', 'Mumbai', 'Chennai', 'Pune'],
      years: years.length ? years.sort((a, b) => b - a) : [2025, 2024, 2023, 2022, 2021],
      dealers,
      testimonials: googleReviews,
      faqs: STATIC_FAQS,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching home metadata', error: error.message });
  }
});

module.exports = router;