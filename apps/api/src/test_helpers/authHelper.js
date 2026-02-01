/**
 * Authentication Helper for HTTP Integration Tests
 * 
 * Provides utilities for registering and logging in test users.
 */

import request from 'supertest';

/**
 * Register a new user and login, returning the JWT access token
 * @param {Express.Application} app - Express app instance
 * @param {string} [prefix='test'] - Prefix for the email address
 * @returns {Promise<string>} JWT access token
 */
async function registerAndLogin(app, prefix = 'test') {
  const email = `${prefix}-${Date.now()}@example.com`;
  const password = 'password123';

  await request(app)
    .post('/api/auth/register')
    .send({ email, password });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return loginRes.body.data.accessToken;
}

/**
 * Register a new user and login, returning both token and email
 * @param {Express.Application} app - Express app instance
 * @param {string} [prefix='test'] - Prefix for the email address
 * @returns {Promise<{ token: string, email: string }>}
 */
async function registerAndLoginWithEmail(app, prefix = 'test') {
  const email = `${prefix}-${Date.now()}@example.com`;
  const password = 'password123';

  await request(app)
    .post('/api/auth/register')
    .send({ email, password });

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
