/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("products", (table) => {
    // Imagen principal (cover)
    table.string("image_url", 2048).nullable();

    // Galería de imágenes (array de urls)
    table.json("gallery_json").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("products", (table) => {
    table.dropColumn("image_url");
    table.dropColumn("gallery_json");
  });
};