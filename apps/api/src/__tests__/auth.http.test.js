// auth.http.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

const baseUrl = '/api/auth';

// Helper to register a user
async function registerUser(email = 'user@example.com', password = 'password123') {
  return request(app)
    .post(`${baseUrl}/register`)
    .send({ email, password });
}

describe('Auth HTTP API', () => {
  beforeEach(async () => {
    // No-op: InMemory repo resets between tests by design
  });

  it('POST /api/auth/register -> 201 and returns userId/email/role, no passwordHash', async () => {
    const res = await registerUser('test1@example.com', 'password123');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: {
        userId: expect.any(String),
        email: 'test1@example.com',
        role: 'customer',
      },
    });
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register duplicate -> 409 "Email already exists"', async () => {
    await registerUser('dupe@example.com', 'password123');
    const res = await registerUser('dupe@example.com', 'password123');
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Email already exists',
    });
  });

  it('POST /api/auth/login -> 200 and returns accessToken string', async () => {
    await registerUser('login@example.com', 'password123');
    const res = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: {
        accessToken: expect.any(String),
      },
    });
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  it('POST /api/auth/login wrong password -> 401 "Invalid credentials"', async () => {
    await registerUser('wrongpw@example.com', 'password123');
    const res = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'wrongpw@example.com', password: 'badpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Invalid credentials',
    });
  });

  it('POST /api/auth/login -> returns both accessToken and refreshToken', async () => {
    await registerUser('tokens@example.com', 'password123');
    const res = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'tokens@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(typeof res.body.data.refreshToken).toBe('string');
    expect(res.body.data.refreshToken.length).toBeGreaterThan(0);
  });

  it('POST /api/auth/refresh -> 200 with new accessToken for valid refreshToken', async () => {
    await registerUser('refresh@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'refresh@example.com', password: 'password123' });
    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: {
        accessToken: expect.any(String),
      },
    });
  });

  it('POST /api/auth/refresh -> 401 with invalid refreshToken', async () => {
    const res = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: 'invalid-token-that-does-not-exist' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });
  });

  it('POST /api/auth/logout -> 200 success true', async () => {
    await registerUser('logout@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'logout@example.com', password: 'password123' });
    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post(`${baseUrl}/logout`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { success: true },
    });
  });

  it('POST /api/auth/refresh -> 401 after logout (token revoked)', async () => {
    await registerUser('revoked@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'revoked@example.com', password: 'password123' });
    const { refreshToken } = loginRes.body.data;

    // Logout to revoke token
    await request(app)
      .post(`${baseUrl}/logout`)
      .send({ refreshToken });

    // Try to refresh with revoked token
    const res = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });
  });
});

