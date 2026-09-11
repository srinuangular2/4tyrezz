const crypto = require('crypto');

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function createToken(ttlMs = 60 * 60 * 1000) {
  const raw = crypto.randomBytes(32).toString('hex');
  return {
    raw,
    hash: hashToken(raw),
    expires: new Date(Date.now() + ttlMs),
  };
}

function publicAppUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

function issueDevLink(kind, raw) {
  if (kind === 'verify') return `${publicAppUrl()}/customer/verify-email?token=${raw}`;
  return `${publicAppUrl()}/customer/reset-password?token=${raw}`;
}

module.exports = { hashToken, createToken, publicAppUrl, issueDevLink };
