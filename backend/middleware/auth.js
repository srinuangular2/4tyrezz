const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DealerProfile = require('../models/DealerProfile');
const { getPermissionsForUser } = require('../utils/rbacBootstrap');
const { permissionsForRole } = require('../config/permissions');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    req.user = user;
    req.permissions =
      decoded.permissions?.length ? decoded.permissions : await getPermissionsForUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user?.isActive) {
        req.user = user;
        req.permissions = decoded.permissions?.length
          ? decoded.permissions
          : await getPermissionsForUser(user);
      }
    }
  } catch {
    /* ignore */
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden — insufficient role' });
  }
  next();
};

const requirePermission = (...needed) => (req, res, next) => {
  const perms = req.permissions || permissionsForRole(req.user?.role);
  // Super-admin / admin shortcut for legacy
  if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
    return next();
  }
  const ok = needed.some((p) => perms.includes(p));
  if (!ok) {
    return res.status(403).json({ message: 'Forbidden — missing permission', required: needed });
  }
  next();
};

const requireDealerKyc = async (req, res, next) => {
  if (req.user?.role !== 'dealer') return next();
  const profile = await DealerProfile.findOne({ user: req.user._id }).select('kycStatus kycVerified');
  const verified = Boolean(profile?.kycVerified || profile?.kycStatus === 'approved' || req.user.kycVerified);
  if (!verified) {
    return res.status(403).json({
      message: 'Complete dealer KYC and wait for approval before listing cars',
      kycStatus: profile?.kycStatus || 'PENDING_KYC_APPROVAL',
      kycVerified: false,
    });
  }
  next();
};

const protectCustomerRoute = authorize('customer');

const protectAdminRoute = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden — admin only' });
  }
  return next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  requirePermission,
  requireDealerKyc,
  protectDealerRoute: authorize('dealer', 'admin'),
  protectDealerOrAdmin: authorize('dealer', 'admin'),
  protectCustomerRoute,
  protectAdminRoute,
};
