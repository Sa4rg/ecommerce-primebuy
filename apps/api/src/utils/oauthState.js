const crypto = require('crypto');

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { generateState };