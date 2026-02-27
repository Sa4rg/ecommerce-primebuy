/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("products", (table) => {
    // i18n fields
    table.string("name_es", 255).nullable();
    table.string("name_en", 255).nullable();

    table.text("short_desc_es").nullable();
    table.text("short_desc_en").nullable();

    // JSON specs (as TEXT for compatibility; MySQL JSON ok too)
    // If your MySQL supports JSON, you can use table.json("specs_json")
    table.json("specs_json").nullable();
  });

  // Backfill basic values from existing "name"
  await knex("products")
    .whereNull("name_es")
    .update({ name_es: knex.ref("name") });

  await knex("products")
    .whereNull("name_en")
    .update({ name_en: knex.ref("name") });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("products", (table) => {
    table.dropColumn("name_es");
    table.dropColumn("name_en");
    table.dropColumn("short_desc_es");
    table.dropColumn("short_desc_en");
    table.dropColumn("specs_json");
  });
};