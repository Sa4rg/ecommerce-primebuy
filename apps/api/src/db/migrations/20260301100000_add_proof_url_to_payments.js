/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("payments", (table) => {
    table.string("proof_url", 512).nullable().after("proof_note");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("payments", (table) => {
    table.dropColumn("proof_url");
  });
};
