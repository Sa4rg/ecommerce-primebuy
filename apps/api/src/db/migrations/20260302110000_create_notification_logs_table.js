/**
 * Migration: Create notification_logs table
 * 
 * Stores a log of all notifications sent (email, SMS, etc.)
 * for auditing and debugging purposes.
 */

exports.up = function (knex) {
  return knex.schema.createTable('notification_logs', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').nullable().index();
    table.string('email', 255).nullable();
    table.string('type', 50).notNullable().index(); // payment_submitted, order_confirmed, etc.
    table.string('channel', 20).notNullable().defaultTo('email'); // email, sms, push
    table.string('subject', 255).nullable();
    table.text('body').nullable();
    table.uuid('related_entity_id').nullable(); // orderId, paymentId, etc.
    table.string('related_entity_type', 50).nullable(); // 'order', 'payment', etc.
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, sent, failed, skipped
    table.text('error_message').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('sent_at').nullable();
    
    // Index for querying logs by entity
    table.index(['related_entity_type', 'related_entity_id'], 'idx_notification_entity');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notification_logs');
};
