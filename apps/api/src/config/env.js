// Load environment variables
const path = require('path');
const fs = require('fs');

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, '../../', `.env.${nodeEnv}`);

// Si existe .env.test o .env.local, lo carga
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
}

// Siempre carga .env como fallback para variables no definidas
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS, 10) || 7;
const REFRESH_TOKEN_PEPPER = process.env.REFRESH_TOKEN_PEPPER || '';

// Password reset
const RESET_CODE_PEPPER = process.env.RESET_CODE_PEPPER || '9b2af6de8f7c0a2c17456d953ba4ea7f4f17b7f6d6d2a8cc2a2b170eb819f6d1';
const RESET_CODE_EXPIRES_MINUTES = parseInt(process.env.RESET_CODE_EXPIRES_MINUTES, 10) || 15;

// Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';

// App URL (frontend)
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || 'http://localhost:5173';

// Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

// Fail fast in production if JWT_SECRET is missing
if (NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required in production.'
  );
}

// Fail fast in production if REFRESH_TOKEN_PEPPER is missing
if (NODE_ENV === 'production' && !REFRESH_TOKEN_PEPPER) {
  throw new Error(
    'FATAL: REFRESH_TOKEN_PEPPER environment variable is required in production. ' +
    'Set it to a long random secret for refresh token hashing security.'
  );
}


// Fail fast in production if RESET_CODE_PEPPER is missing
if (NODE_ENV === 'production' && !process.env.RESET_CODE_PEPPER) {
  throw new Error(
    'FATAL: RESET_CODE_PEPPER environment variable is required in production. ' +
    'Set it to a long random secret for password reset code hashing security.'
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
  REFRESH_TOKEN_PEPPER,
  RESET_CODE_PEPPER,
  RESET_CODE_EXPIRES_MINUTES,
  RESEND_API_KEY,
  RESEND_FROM,
  APP_PUBLIC_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
};