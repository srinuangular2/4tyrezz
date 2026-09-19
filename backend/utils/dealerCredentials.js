const crypto = require('crypto');

function compactToken(value, max = 12) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, '')
    .slice(0, max);
}

function titleCaseCompact(value, max) {
  const token = compactToken(value, max);
  if (!token) return '';
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDealerCode(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

async function codeExists(User, code) {
  const compact = code.replace(/-/g, '');
  return User.findOne({
    $or: [
      { dealerCode: new RegExp(`^${escapeRegex(code)}$`, 'i') },
      { dealerCode: new RegExp(`^${escapeRegex(compact)}$`, 'i') },
    ],
  }).select('_id');
}

async function generateDealerCode({ User } = {}) {
  const year = String(new Date().getFullYear());
  for (let i = 0; i < 32; i += 1) {
    const n = String(crypto.randomInt(10000, 100000));
    const code = `4T-${year}-${n}`;
    const exists = User ? await codeExists(User, code) : null;
    if (!exists) return code;
  }
  return `4T-${year}-${Date.now().toString().slice(-6)}`;
}

function generateStrongPassword(length = 12) {
  const size = Math.min(12, Math.max(8, Number(length) || 12));
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$%&*!';
  const all = upper + lower + digits + special;
  const pick = (set) => set[crypto.randomInt(0, set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < size) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function isStrongPassword(password) {
  const value = String(password || '');
  return value.length >= 8 && value.length <= 12;
}

function dealerCodeQuery(value) {
  const code = normalizeDealerCode(value);
  if (!code) return null;
  const compact = code.replace(/-/g, '');
  const hyphenated = compact.length === 11 && compact.startsWith('4T')
    ? `4T-${compact.slice(2, 6)}-${compact.slice(6)}`
    : code;
  return {
    $or: [
      { dealerCode: new RegExp(`^${escapeRegex(code)}$`, 'i') },
      { dealerCode: new RegExp(`^${escapeRegex(compact)}$`, 'i') },
      { dealerCode: new RegExp(`^${escapeRegex(hyphenated)}$`, 'i') },
    ],
  };
}

async function ensureDealerCodes(User) {
  const missing = await User.find({
    role: 'dealer',
    $or: [{ dealerCode: { $exists: false } }, { dealerCode: null }, { dealerCode: '' }],
  }).select('name dealershipName dealerCode');
  let issued = 0;
  for (const user of missing) {
    user.dealerCode = await generateDealerCode({ User });
    await user.save();
    issued += 1;
  }
  if (issued) console.log(`[dealer-id] issued ${issued} Dealer ID${issued === 1 ? '' : 's'}`);
  return issued;
}

module.exports = {
  generateDealerCode,
  generateStrongPassword,
  isStrongPassword,
  dealerCodeQuery,
  ensureDealerCodes,
  normalizeDealerCode,
};
