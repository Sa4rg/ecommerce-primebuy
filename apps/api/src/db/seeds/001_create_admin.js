/**
 * Seed: Create admin user
 * 
 * Run: pnpm --filter api exec knex seed:run --specific=001_create_admin.js
 * 
 * Creates an admin user if it doesn't exist.
 * 
 * Default credentials:
 * - Email: admin@ecommerce.com
 * - Password: Admin123!
 */

const crypto = require('crypto');
const argon2 = require('argon2');

const ADMIN_EMAIL = 'admin@ecommerce.com';
const ADMIN_PASSWORD = 'Admin123!';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Check if admin already exists
  const existing = await knex('users')
    .where({ email: ADMIN_EMAIL })
    .first();

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    return;
  }

  // Create admin user
  const userId = crypto.randomUUID();
  const passwordHash = await argon2.hash(ADMIN_PASSWORD);
  const now = new Date();

  await knex('users').insert({
    user_id: userId,
    email: ADMIN_EMAIL,
    password_hash: passwordHash,
    role: 'admin',
    created_at: now,
    updated_at: now,
  });

  console.log(`Admin user created: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
};
