// Migration: Add email_verified column to users table
exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.index(["email_verified"]);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropIndex(["email_verified"]);
    table.dropColumn("email_verified");
  });
};
