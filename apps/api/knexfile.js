// Load environment variables
require('dotenv').config();

/**
 * Knex Configuration
 * 
 * This file configures Knex for database migrations and connections.
 * Uses environment variables from .env file.
 */

// SSL configuration helpers
const useSsl = process.env.DB_SSL === '1';
const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== '0';

// Build SSL config if enabled
const sslConfig = useSsl ? { rejectUnauthorized: sslRejectUnauthorized } : undefined;

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'ecommerce',
      password: process.env.DB_PASSWORD || 'ecommerce',
      database: process.env.DB_NAME || 'ecommerce_dev',
      ...(useSsl && { ssl: sslConfig }),
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    pool: {
      min: 2,
      max: 10,
    },
    acquireConnectionTimeout: 10000,
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'ecommerce',
      password: process.env.DB_PASSWORD || 'ecommerce',
      database: process.env.DB_NAME_TEST || 'ecommerce_test',
      ...(useSsl && { ssl: sslConfig }),
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    pool: {
      min: 1,
      max: 5,
    },
    acquireConnectionTimeout: 10000,
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ...(useSsl && { ssl: sslConfig }),
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    pool: {
      min: 2,
      max: 20,
    },
    acquireConnectionTimeout: 10000,
  },
};
