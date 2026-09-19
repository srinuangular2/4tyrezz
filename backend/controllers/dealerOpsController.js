const Car = require('../models/Car');

exports.analytics = async (req, res) => {
  const owner = req.user._id;
  const [listings, pending, approved, sold] = await Promise.all([
    Car.countDocuments({ owner }),
    Car.countDocuments({ owner, status: 'pending' }),
    Car.countDocuments({ owner, status: 'approved' }),
    Car.countDocuments({ owner, status: 'sold' }),
  ]);

  res.json({
    success: true,
    data: {
      listings,
      pending,
      approved,
      sold,
      buyerLeads: 0,
      testDrives: 0,
      financeInsurance: 0,
    },
  });
};

exports.buyerLeads = async (_req, res) => {
  res.json({ success: true, data: [] });
};

exports.sellerLeads = async (_req, res) => {
  res.json({ success: true, data: [], pipeline: [] });
};

exports.financeInsuranceLeads = async (_req, res) => {
  res.json({ success: true, data: [] });
};

exports.updateLead = async (_req, res) => {
  return res.status(403).json({ message: 'Buyer leads are handled by 4tyrezz admin' });
};
