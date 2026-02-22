// password_reset_requests migration
exports.up = function (knex) {
  return knex.schema.createTable("password_reset_requests", (table) => {
    table.string("request_id", 36).primary().notNullable();

    // Allow null to avoid leaking whether user exists
    table.string("user_id", 36).nullable();

    // Always store email for UX & auditing
    table.string("email", 255).notNullable();

    // sha256 hex => 64 chars
    table.string("code_hash", 64).notNullable();

    table.integer("attempts").notNullable().defaultTo(0);

    table.datetime("expires_at").notNullable();
    table.datetime("used_at").nullable();
    table.datetime("created_at").notNullable();

    table
      .foreign("user_id")
      .references("user_id")
      .inTable("users")
      .onDelete("SET NULL")
      .onUpdate("RESTRICT");

    table.index(["email"]);
    table.index(["user_id"]);
    table.index(["expires_at"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("password_reset_requests");
};