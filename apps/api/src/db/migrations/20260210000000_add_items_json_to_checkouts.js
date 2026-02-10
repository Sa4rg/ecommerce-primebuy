exports.up = function (knex) {
  return knex.schema.alterTable("checkouts", (table) => {
    table.json("items_json").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("checkouts", (table) => {
    table.dropColumn("items_json");
  });
};
