/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.string('refresh_token_id', 36).primary().notNullable();
    table.string('user_id', 36).notNullable();
    table.string('token_hash', 64).notNullable().unique();
    table.datetime('expires_at').notNullable();
    table.datetime('revoked_at').nullable();
    table.datetime('created_at').notNullable();

    // Foreign key to users table
    table
      .foreign('user_id')
      .references('user_id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('RESTRICT');

    // Indexes for common queries
    table.index('user_id');
    table.index('expires_at');
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('refresh_tokens');
};