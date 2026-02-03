/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Step 1: add nullable column
  await knex.schema.alterTable('carts', (table) => {
    table.string('user_id', 36).nullable();
    table.index('user_id');
  });

  // Step 2: make NOT NULL + FK
  await knex.schema.alterTable('carts', (table) => {
    table.string('user_id', 36).notNullable().alter();
    table
      .foreign('user_id')
      .references('user_id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('RESTRICT');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('carts', (table) => {
    table.dropForeign('user_id');
    table.dropIndex('user_id');
    table.dropColumn('user_id');
  });
};
