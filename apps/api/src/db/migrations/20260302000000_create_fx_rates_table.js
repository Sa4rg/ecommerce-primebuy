/**
 * Migration: Create fx_rates table
 *
 * Stores daily FX rate used for USD -> VES conversions.
 *
 * - rate_id: VARCHAR(36) PRIMARY KEY (UUID)
 * - rate_date: DATE (unique per day)
 * - base_currency: USD (default)
 * - quote_currency: VES (default)
 * - rate: DECIMAL(12,6)
 * - source: manual / bcv / etc
 * - created_by: user_id (optional)
 * - timestamps
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("fx_rates", (table) => {
    table.string("rate_id", 36).primary().notNullable();
    table.date("rate_date").notNullable();
    table.string("base_currency", 3).notNullable().defaultTo("USD");
    table.string("quote_currency", 3).notNullable().defaultTo("VES");
    table.decimal("rate", 12, 6).notNullable();
    table.string("source", 32).nullable();
    table.string("created_by", 36).nullable();
    table.datetime("created_at").notNullable();
    table.datetime("updated_at").notNullable();

    table.unique(["rate_date", "base_currency", "quote_currency"]);
    table.index(["rate_date"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("fx_rates");
};