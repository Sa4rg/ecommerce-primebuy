/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasUserId = await knex.schema.hasColumn("carts", "user_id");
  if (!hasUserId) return;

  await knex.schema.alterTable("carts", (table) => {
    table.string("user_id", 36).nullable().alter();
  });
};

exports.down = async function (knex) {
  const hasUserId = await knex.schema.hasColumn("carts", "user_id");
  if (!hasUserId) return;

  // OJO: si existen carts anónimos, esto podría fallar al volver a NOT NULL
  // Pero lo dejamos igual por consistencia de rollback.
  await knex.schema.alterTable("carts", (table) => {
    table.string("user_id", 36).notNullable().alter();
  });
};

