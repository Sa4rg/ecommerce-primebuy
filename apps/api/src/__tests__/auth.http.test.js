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
});

