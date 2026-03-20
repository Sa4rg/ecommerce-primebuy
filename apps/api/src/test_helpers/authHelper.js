/**
 * Authentication Helper for HTTP Integration Tests
 * 
 * Provides utilities for registering and logging in test users.
 * 
 * ⚠️ httpOnly Cookies Migration:
 * After migrating to httpOnly cookies, accessToken is no longer in response body.
 * This helper extracts the token from Set-Cookie headers for backward compatibility
 * with existing tests that use Authorization header.
 */

import request from 'supertest';

// Lazy load the repository using require (root.js is CommonJS)
function getUsersRepository() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { repositories } = require('../composition/root');
  return repositories.usersRepository;
}

/**
 * Extract accessToken from Set-Cookie headers
 * @param {Response} res - Supertest response object
 * @returns {string|null} JWT access token or null if not found
 */
function extractAccessTokenFromCookies(res) {
  const cookies = res.headers['set-cookie'];
  if (!cookies || !Array.isArray(cookies)) {
    return null;
  }

  for (const cookie of cookies) {
    if (cookie.startsWith('accessToken=')) {
      // Extract value between 'accessToken=' and first ';'
      const match = cookie.match(/^accessToken=([^;]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Register a new user, verify email, and login, returning the JWT access token
 * @param {Express.Application} app - Express app instance
 * @param {string} [prefix='test'] - Prefix for the email address
 * @returns {Promise<string>} JWT access token
 */
async function registerAndLogin(app, prefix = 'test') {
  const email = `${prefix}-${Date.now()}@example.com`;
  const password = 'Password123!';

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password });

  // Mark email as verified for testing
  const userId = registerRes.body.data?.userId;
  if (userId) {
    const repo = getUsersRepository();
    await repo.markEmailVerified(userId);
  }

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  // Extract token from httpOnly cookie (not in body anymore)
  const token = extractAccessTokenFromCookies(loginRes);
  if (!token) {
    throw new Error('Failed to extract accessToken from login response cookies');
  }

  return token;
}

/**
 * Register a new user, verify email, and login, returning both token and email
 * @param {Express.Application} app - Express app instance
 * @param {string} [prefix='test'] - Prefix for the email address
 * @returns {Promise<{ token: string, email: string }>}
 */
async function registerAndLoginWithEmail(app, prefix = 'test') {
  const email = `${prefix}-${Date.now()}@example.com`;
  const password = 'Password123!';

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password });

  // Mark email as verified for testing
  const userId = registerRes.body.data?.userId;
  if (userId) {
    const repo = getUsersRepository();
    await repo.markEmailVerified(userId);
  }

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  // Extract token from httpOnly cookie (not in body anymore)
  const token = extractAccessTokenFromCookies(loginRes);
  if (!token) {
    throw new Error('Failed to extract accessToken from login response cookies');
  }

  return {
    token,
    email
  };
}

export {
  registerAndLogin,
  registerAndLoginWithEmail,
  extractAccessTokenFromCookies
};
