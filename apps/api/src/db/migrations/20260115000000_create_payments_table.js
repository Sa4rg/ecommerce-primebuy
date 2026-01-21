/**
 * Migration: Create payments table
 * 
 * Creates the payments table with:
 * - payment_id: VARCHAR(36) PRIMARY KEY (UUID from service)
 * - checkout_id: VARCHAR(36) NOT NULL
 * - method, currency, amount, status
 * - Proof columns (flat): proof_reference, proof_date, proof_note
 * - Review columns (flat): review_note, review_reason
 * - Timestamps: created_at, updated_at
 * - Indexes: checkout_id, status
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('payments', (table) => {
    // Primary key
    table.string('payment_id', 36).primary().notNullable();
    
    // Core payment fields
    table.string('checkout_id', 36).notNullable();
    table.string('method', 32).notNullable();
    table.string('currency', 3).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('status', 16).notNullable();
    
    // Proof columns (nullable)
    table.string('proof_reference', 128).nullable();
    table.string('proof_date', 32).nullable();
    table.string('proof_note', 255).nullable();
    
    // Review columns (nullable)
    table.string('review_note', 255).nullable();
    table.string('review_reason', 255).nullable();
    
    // Timestamps
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    
    // Indexes
    table.index('checkout_id');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('payments');
};
