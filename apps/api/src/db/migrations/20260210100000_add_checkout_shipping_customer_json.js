exports.up = function (knex) {
  return knex.schema.alterTable("checkouts", (table) => {
    table.json("shipping_json").nullable();
    table.json("customer_json").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("checkouts", (table) => {
    table.dropColumn("shipping_json");
    table.dropColumn("customer_json");
  });
};
