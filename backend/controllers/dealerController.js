exports.listDealers = async (_req, res) => {
  return res.status(404).json({ message: 'Not found', data: [], total: 0 });
};

exports.getDealer = async (_req, res) => {
  return res.status(404).json({ message: 'Dealer not found' });
};
