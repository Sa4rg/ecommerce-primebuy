/**
 * Knex Database Connection
 * 
 * Singleton instance of Knex configured from environment variables.
 * Uses the same configuration as knexfile.js for consistency.
 */

const knex = require('knex');
const knexConfig = require('../../knexfile');

// Determine environment (default to development)
const environment = process.env.NODE_ENV || 'development';

// Create and export singleton Knex instance
const db = knex(knexConfig[environment]);

module.exports = db;
