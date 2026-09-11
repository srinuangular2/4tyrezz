const jwt = require('jsonwebtoken');

function issueMobileToken(mobile) {
  return jwt.sign({ purpose: 'dealer-mobile', mobile }, process.env.JWT_SECRET, { expiresIn: '30m' });
}

function readMobileToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== 'dealer-mobile') return null;
    return payload.mobile;
  } catch {
    return null;
  }
}

module.exports = { issueMobileToken, readMobileToken };
