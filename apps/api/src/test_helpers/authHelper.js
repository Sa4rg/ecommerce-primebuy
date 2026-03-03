/**
 * Authentication Helper for HTTP Integration Tests
 * 
 * Provides utilities for registering and logging in test users.
 */

import request from 'supertest';

// Lazy load the repository using require (root.js is CommonJS)
function getUsersRepository() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { repositories } = require('../composition/root');
  return repositories.usersRepository;
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

  return loginRes.body.data.accessToken;
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

  return {
    token: loginRes.body.data.accessToken,
    email
  };
}

export {
  registerAndLogin,
  registerAndLoginWithEmail
};
