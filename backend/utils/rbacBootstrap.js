const Role = require('../models/Role');
const { ROLE_PERMISSIONS, permissionsForRole } = require('../config/permissions');

const ROLE_NAMES = {
  customer: 'Customer',
  dealer_staff: 'Dealer Staff',
  dealer: 'Dealer',
  dealer_owner: 'Dealer Owner/Manager',
  operations: '4TYREZZ Operations/Sales',
  finance_admin: '4TYREZZ Finance/Admin',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

async function bootstrapRoles() {
  for (const [key, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    await Role.findOneAndUpdate(
      { key },
      {
        key,
        name: ROLE_NAMES[key] || key,
        permissions,
        isSystem: true,
      },
      { upsert: true, new: true }
    );
  }
  console.log('RBAC roles bootstrapped');
}

async function getPermissionsForUser(user) {
  if (!user) return [];
  if (Array.isArray(user.permissions) && user.permissions.length) return user.permissions;
  const roleDoc = await Role.findOne({ key: user.role === 'dealer' ? 'dealer' : user.role });
  if (roleDoc?.permissions?.length) return roleDoc.permissions;
  return permissionsForRole(user.role);
}

module.exports = { bootstrapRoles, getPermissionsForUser, ROLE_NAMES };
