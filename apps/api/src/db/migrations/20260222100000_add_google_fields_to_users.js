exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.string("google_sub", 255).unique().nullable();
    table.string("name", 255).nullable();
    table.string("auth_provider", 32).notNullable().defaultTo("local");

    // Make password optional (Google users)
    table.string("password_hash", 255).nullable().alter();

    table.index(["auth_provider"]);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropIndex(["auth_provider"]);
    table.dropColumn("google_sub");
    table.dropColumn("name");
    table.dropColumn("auth_provider");

    // ⚠️ Avoid forcing NOT NULL because existing Google users may have null password_hash
    // If you REALLY want to revert, you must ensure no null values exist first.
    // table.string("password_hash", 255).notNullable().alter();
  });
};