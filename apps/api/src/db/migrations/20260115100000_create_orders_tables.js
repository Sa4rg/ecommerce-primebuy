/**
 * Migration: Create orders tables
 * 
 * Creates 5 tables for order snapshots:
 * - orders (main order record)
 * - order_items (line items snapshot)
 * - order_customer (customer snapshot)
 * - order_tax (tax settings snapshot)
 * - order_shipping (shipping details snapshot)
 * 
 * No foreign keys for MVP simplicity.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. orders table
    .createTable('orders', (table) => {
      table.string('order_id', 36).primary().notNullable();
      table.string('cart_id', 36).notNullable();
      table.string('checkout_id', 36).notNullable();
      table.string('payment_id', 36).notNullable();
      table.string('status', 32).notNullable();
      table.decimal('subtotal_usd', 12, 2).notNullable();
      table.decimal('subtotal_ves', 12, 2).nullable();
      table.string('currency', 3).notNullable();
      table.decimal('amount_paid', 12, 2).notNullable();
      table.string('exchange_provider', 32).nullable();
      table.decimal('exchange_usd_to_ves', 12, 6).nullable();
      table.string('exchange_as_of', 64).nullable();
      table.string('payment_method', 32).notNullable();
      table.string('payment_proof_reference', 128).nullable();
      table.string('payment_review_note', 255).nullable();
      table.string('payment_review_reason', 255).nullable();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      
      table.index('payment_id');
      table.index('status');
    })
    
    // 2. order_items table
    .createTable('order_items', (table) => {
      table.increments('id').primary();
      table.string('order_id', 36).notNullable();
      table.string('product_id', 36).notNullable();
      table.string('name', 255).notNullable();
      table.decimal('unit_price_usd', 12, 2).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('line_total_usd', 12, 2).notNullable();
      
      table.index('order_id');
    })
    
    // 3. order_customer table
    .createTable('order_customer', (table) => {
      table.string('order_id', 36).primary().notNullable();
      table.string('email', 255).nullable();
      table.string('name', 255).nullable();
      table.string('phone', 64).nullable();
    })
    
    // 4. order_tax table
    .createTable('order_tax', (table) => {
      table.string('order_id', 36).primary().notNullable();
      table.boolean('price_includes_vat').notNullable();
      table.decimal('vat_rate', 6, 4).notNullable();
    })
    
    // 5. order_shipping table
    .createTable('order_shipping', (table) => {
      table.string('order_id', 36).primary().notNullable();
      table.string('method', 32).nullable();
      table.string('status', 32).notNullable();
      table.string('address_recipient_name', 255).nullable();
      table.string('address_phone', 64).nullable();
      table.string('address_state', 64).nullable();
      table.string('address_city', 64).nullable();
      table.string('address_line1', 255).nullable();
      table.string('address_reference', 255).nullable();
      table.string('carrier_name', 32).nullable();
      table.string('carrier_tracking_number', 128).nullable();
      table.datetime('dispatched_at').nullable();
      table.datetime('delivered_at').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Drop tables in reverse order
  return knex.schema
    .dropTableIfExists('order_shipping')
    .dropTableIfExists('order_tax')
    .dropTableIfExists('order_customer')
    .dropTableIfExists('order_items')
    .dropTableIfExists('orders');
};
