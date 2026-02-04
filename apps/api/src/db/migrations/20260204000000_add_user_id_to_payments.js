exports.up = async function (knex) {
  await knex.schema.alterTable("payments", (table) => {
    table.string("user_id", 36).nullable();
    table.index("user_id");
  });

  await knex.schema.alterTable("payments", (table) => {
    table
      .foreign("user_id")
      .references("user_id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("RESTRICT");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("payments", (table) => {
    table.dropForeign("user_id");
    table.dropIndex("user_id");
    table.dropColumn("user_id");
  });
};
