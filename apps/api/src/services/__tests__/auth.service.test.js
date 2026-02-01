// auth.service.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
const { createAuthService } = require('../auth.service');
const UsersMemoryRepository = require('../../repositories/users/users.memory.repository');
const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test_jwt_secret';
const TEST_EXPIRES_IN = '1h';
const FIXED_DATE = '2026-01-31T12:00:00.000Z';
const FIXED_ID = 'fixed-user-id';

function deterministicIdGenerator() { return FIXED_ID; }
function deterministicNowProvider() { return FIXED_DATE; }
function deterministicJwtSigner(payload, options) {
  return jwt.sign(payload, TEST_SECRET, { ...options, algorithm: 'HS256' });
}

describe('auth.service', () => {
  let usersRepository;
  let authService;

  beforeEach(() => {
    usersRepository = new UsersMemoryRepository();
    authService = createAuthService({
      usersRepository,
      idGenerator: deterministicIdGenerator,
      nowProvider: deterministicNowProvider,
      jwtSigner: deterministicJwtSigner,
    });
  });

  // 1) should register a user and return safe user data (no passwordHash)
  it('should register a user and return safe user data', async () => {
    const result = await authService.register('Test@Email.com', 'password123');
    expect(result).toEqual({
      userId: FIXED_ID,
      email: 'test@email.com',
      role: 'customer',
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    });
    // Ensure passwordHash is not returned
    expect(result.passwordHash).toBeUndefined();
  });

  // 2) should throw 409 when email already exists
  it('should throw 409 when email already exists', async () => {
    await authService.register('duplicate@email.com', 'password123');
    await expect(authService.register('duplicate@email.com', 'password123'))
      .rejects.toMatchObject({ message: 'Email already exists', statusCode: 409 });
  });

  // 3) should throw 400 for invalid email
  it('should throw 400 for invalid email', async () => {
    await expect(authService.register('', 'password123'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
    await expect(authService.register(null, 'password123'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
    await expect(authService.register(123, 'password123'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
  });

  // 4) should throw 400 for short password (< 8)
  it('should throw 400 for short password', async () => {
    await expect(authService.register('short@pw.com', '123'))
      .rejects.toMatchObject({ message: 'Password must be at least 8 characters', statusCode: 400 });
  });

  // 5) should return accessToken for valid credentials
  it('should return accessToken for valid credentials', async () => {
    await authService.register('login@email.com', 'password123');
    const result = await authService.login('login@email.com', 'password123');
    expect(result).toHaveProperty('accessToken');
    // Verify JWT
    const decoded = jwt.verify(result.accessToken, TEST_SECRET);
    expect(decoded).toMatchObject({ sub: FIXED_ID, role: 'customer' });
  });

  // 6) should throw 401 for invalid credentials (wrong password)
  it('should throw 401 for invalid credentials (wrong password)', async () => {
    await authService.register('wrongpw@email.com', 'password123');
    await expect(authService.login('wrongpw@email.com', 'wrongpassword'))
      .rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });
  });

  // 7) should throw 401 for invalid credentials (email not found)
  it('should throw 401 for invalid credentials (email not found)', async () => {
    await expect(authService.login('notfound@email.com', 'password123'))
      .rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });
  });
});
