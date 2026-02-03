require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS, 10) || 7;

// Fail fast in production if JWT_SECRET is missing
if (NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required in production.'
  );
}

// Database configuration
const DB_PROVIDER = process.env.DB_PROVIDER;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Fail fast in production if FRONTEND_ORIGIN is missing
if (NODE_ENV === 'production' && !FRONTEND_ORIGIN) {
  throw new Error(
    'FATAL: FRONTEND_ORIGIN environment variable is required in production. ' +
    'Set it to your frontend domain (e.g., https://example.com)'
  );
}

// Fail fast in production if database config is missing or invalid
if (NODE_ENV === 'production') {
  const missingVars = [];
  
  if (DB_PROVIDER !== 'mysql') {
    missingVars.push('DB_PROVIDER (must be "mysql")');
  }
  if (!DB_HOST) {
    missingVars.push('DB_HOST');
  }
  if (!DB_USER) {
    missingVars.push('DB_USER');
  }
  if (!DB_PASSWORD) {
    missingVars.push('DB_PASSWORD');
  }
  if (!DB_NAME) {
    missingVars.push('DB_NAME');
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      'FATAL: Database configuration is incomplete in production. ' +
      `Missing or invalid: ${missingVars.join(', ')}`
    );
  }
}

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV,
  FRONTEND_ORIGIN,
  DB_PROVIDER,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN_DAYS,
};