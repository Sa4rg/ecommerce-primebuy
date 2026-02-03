/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('carts', (table) => {
    table.string('user_id', 36).nullable().alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('carts', (table) => {
    table.string('user_id', 36).notNullable().alter();
  });
};
