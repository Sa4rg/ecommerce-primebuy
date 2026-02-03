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

  it('POST /api/auth/login -> sets refreshToken cookie (HttpOnly) and does NOT expose in JSON', async () => {
    await registerUser('tokens@example.com', 'password123');
    const res = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'tokens@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.refreshToken).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieString = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieString).toMatch(/refreshToken=/);
    expect(cookieString).toMatch(/HttpOnly/i);
  });

  it('POST /api/auth/refresh -> 200 with new accessToken for valid cookie', async () => {
    await registerUser('refresh@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'refresh@example.com', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];
    const cookieA = Array.isArray(cookies) ? cookies[0] : cookies;

    const res = await request(app)
      .post(`${baseUrl}/refresh`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: {
        accessToken: expect.any(String),
      },
    });

    const newCookies = res.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newCookieString = Array.isArray(newCookies) ? newCookies.join(';') : newCookies;
    expect(newCookieString).toMatch(/refreshToken=/);
  });

  it('POST /api/auth/refresh -> 401 with invalid refreshToken cookie', async () => {
    const res = await request(app)
      .post(`${baseUrl}/refresh`)
      .set('Cookie', 'refreshToken=invalid-token-that-does-not-exist');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });
  });

  it('POST /api/auth/refresh -> 401 when reusing old refresh cookie (token rotation)', async () => {
    await registerUser('rotation@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'rotation@example.com', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];
    const cookieA = Array.isArray(cookies) ? cookies[0] : cookies;

    const refreshRes = await request(app)
      .post(`${baseUrl}/refresh`)
      .set('Cookie', cookieA);
    expect(refreshRes.status).toBe(200);

    const newCookies = refreshRes.headers['set-cookie'];
    const cookieB = Array.isArray(newCookies) ? newCookies[0] : newCookies;

    const reuseRes = await request(app)
      .post(`${baseUrl}/refresh`)
      .set('Cookie', cookieA);
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });

    const validRes = await request(app)
      .post(`${baseUrl}/refresh`)
      .set('Cookie', cookieB);
    expect(validRes.status).toBe(200);
  });

  it('POST /api/auth/logout -> 200 and clears refreshToken cookie', async () => {
    await registerUser('logout@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'logout@example.com', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];
    const cookieA = Array.isArray(cookies) ? cookies[0] : cookies;

    const res = await request(app)
      .post(`${baseUrl}/logout`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { success: true },
    });

    const clearedCookies = res.headers['set-cookie'];
    expect(clearedCookies).toBeDefined();
    const clearedCookieString = Array.isArray(clearedCookies) ? clearedCookies.join(';') : clearedCookies;
    expect(clearedCookieString).toMatch(/refreshToken=/);
    const hasMaxAgeZero = /Max-Age=0/i.test(clearedCookieString);
    const hasExpiredDate = /Expires=Thu, 01 Jan 1970/i.test(clearedCookieString);
    expect(hasMaxAgeZero || hasExpiredDate).toBe(true);
  });

  it('POST /api/auth/refresh -> 401 after logout (token revoked)', async () => {
    await registerUser('revoked@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'revoked@example.com', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];
    const cookieA = Array.isArray(cookies) ? cookies[0] : cookies;

    await request(app)
      .post(`${baseUrl}/logout`)
      .set('Cookie', cookieA);

    const res = await request(app)
      .post(`${baseUrl}/refresh`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });
  });

  it('POST /api/auth/logout-all -> 200 and revokes all sessions', async () => {
    // Register and login to get accessToken and refresh cookie
    await registerUser('logoutall@example.com', 'password123');
    const loginRes = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: 'logoutall@example.com', password: 'password123' });

    const { accessToken } = loginRes.body.data;
    const cookies = loginRes.headers['set-cookie'];
    const cookieA = Array.isArray(cookies) ? cookies[0] : cookies;

    // Call logout-all with Bearer token
    const logoutAllRes = await request(app)
      .post(`${baseUrl}/logout-all`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Expect 200 with success response
    expect(logoutAllRes.status).toBe(200);
    expect(logoutAllRes.body).toMatchObject({
      success: true,
      data: { success: true },
    });

    // Assert cookie clearing
    const clearedCookies = logoutAllRes.headers['set-cookie'];
    expect(clearedCookies).toBeDefined();
    const clearedCookieString = Array.isArray(clearedCookies) ? clearedCookies.join(';') : clearedCookies;
    expect(clearedCookieString).toMatch(/refreshToken=/);
    const hasMaxAgeZero = /Max-Age=0/i.test(clearedCookieString);
    const hasExpiredDate = /Expires=Thu, 01 Jan 1970/i.test(clearedCookieString);
    expect(hasMaxAgeZero || hasExpiredDate).toBe(true);

    // Verify refresh is now blocked with the old cookie
    const refreshRes = await request(app)
      .post(`${baseUrl}/refresh`)
      .set('Cookie', cookieA);

    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });
  });

  it('POST /api/auth/logout-all -> 401 without access token', async () => {
    const res = await request(app)
      .post(`${baseUrl}/logout-all`);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });
  });
});

