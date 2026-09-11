const jwt = require('jsonwebtoken');
const { permissionsForRole } = require('../config/permissions');

const generateToken = (user, permissions) => {
  const perms = permissions || permissionsForRole(user.role);
  return jwt.sign(
    { id: user._id, role: user.role, permissions: perms },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
