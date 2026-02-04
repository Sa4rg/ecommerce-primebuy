/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1) Add column only if it doesn't exist
  const hasUserId = await knex.schema.hasColumn("carts", "user_id");
  if (!hasUserId) {
    await knex.schema.alterTable("carts", (table) => {
      table.string("user_id", 36).nullable();
    });
  }

  // 2) Add index only if it doesn't exist
  // MySQL auto-generates index names sometimes, so we check information_schema
  const indexRes = await knex.raw(`
    SELECT COUNT(*) as count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'carts'
      AND INDEX_NAME = 'carts_user_id_index'
  `);
  const indexExists = indexRes[0][0].count > 0;

  if (!indexExists) {
    await knex.schema.alterTable("carts", (table) => {
      table.index("user_id", "carts_user_id_index");
    });
  }

  // 3) Add FK only if it doesn't exist
  const fkRes = await knex.raw(`
    SELECT COUNT(*) as count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'carts'
      AND CONSTRAINT_NAME = 'carts_user_id_foreign'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);
  const fkExists = fkRes[0][0].count > 0;

  if (!fkExists) {
    await knex.schema.alterTable("carts", (table) => {
      table
        .foreign("user_id", "carts_user_id_foreign")
        .references("user_id")
        .inTable("users")
        .onDelete("RESTRICT")
        .onUpdate("RESTRICT");
    });
  }
};

exports.down = async function (knex) {
  // Down should also be safe
  const hasUserId = await knex.schema.hasColumn("carts", "user_id");
  if (!hasUserId) return;

  // Drop FK if exists
  const fkRes = await knex.raw(`
    SELECT COUNT(*) as count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'carts'
      AND CONSTRAINT_NAME = 'carts_user_id_foreign'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);
  const fkExists = fkRes[0][0].count > 0;

  if (fkExists) {
    await knex.schema.alterTable("carts", (table) => {
      table.dropForeign("user_id", "carts_user_id_foreign");
    });
  }

  // Drop index if exists
  const indexRes = await knex.raw(`
    SELECT COUNT(*) as count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'carts'
      AND INDEX_NAME = 'carts_user_id_index'
  `);
  const indexExists = indexRes[0][0].count > 0;

  if (indexExists) {
    await knex.schema.alterTable("carts", (table) => {
      table.dropIndex("user_id", "carts_user_id_index");
    });
  }

  // Drop column
  await knex.schema.alterTable("carts", (table) => {
    table.dropColumn("user_id");
  });
};
