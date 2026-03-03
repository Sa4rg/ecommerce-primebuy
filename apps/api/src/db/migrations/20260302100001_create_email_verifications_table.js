// Migration: Create email_verifications table
exports.up = function (knex) {
  return knex.schema.createTable("email_verifications", (table) => {
    table.string("verification_id", 36).primary().notNullable();
    table.string("user_id", 36).notNullable();
    table.string("code_hash", 64).notNullable();
    table.integer("attempts").notNullable().defaultTo(0);
    table.datetime("expires_at").notNullable();
    table.datetime("used_at").nullable();
    table.datetime("created_at").notNullable();

    table.index(["user_id"]);
    table.index(["expires_at"]);
    table.foreign("user_id").references("users.user_id").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("email_verifications");
};
