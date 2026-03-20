const crypto = require('crypto');
const { AppError } = require('../utils/errors');

/**
 * CSRF Protection Middleware using Double Submit Cookie pattern
 * 
 * How it works:
 * 1. Generate a random CSRF token
 * 2. Send it BOTH as:
 *    - httpOnly: false cookie (readable by JavaScript)
 *    - Custom header requirement (X-CSRF-Token)
 * 3. On state-changing requests (POST, PUT, DELETE), verify header matches cookie
 * 
 * Why this is secure:
 * - Attacker websites can't read cookies from other origins (SameSite)
 * - Attacker websites can't set custom headers on cross-origin requests
 * - Even if attacker has the cookie, they can't read it to send in header
 */

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to set CSRF token cookie after successful authentication
 * Should be called after login, register, or any action that creates a session
 */
function setCsrfToken(req, res, next) {
  const csrfToken = generateCsrfToken();
  
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // Must be readable by JavaScript
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 15 * 60 * 1000, // Same as access token (15 minutes)
  });
  
  next();
}

/**
 * Middleware to verify CSRF token on state-changing requests
 * Applies to POST, PUT, PATCH, DELETE requests
 */
function verifyCsrfToken(req, res, next) {
  // Skip CSRF protection in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  // Only check state-changing methods
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }
  
  // Skip CSRF for auth endpoints (they use SameSite cookies)
  // Login/Register are protected by SameSite cookies alone
  const path = req.path;
  if (path.startsWith('/api/auth/login') || 
      path.startsWith('/api/auth/register') ||
      path.startsWith('/api/auth/oauth')) {
    return next();
  }
  
  // Get token from header
  const headerToken = req.headers['x-csrf-token'];
  
  // Get token from cookie
  const cookieToken = req.cookies['XSRF-TOKEN'];
  
  // Both must exist and match
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return next(new AppError('Invalid CSRF token', 403));
  }
  
  next();
}

module.exports = {
  generateCsrfToken,
  setCsrfToken,
  verifyCsrfToken,
};
