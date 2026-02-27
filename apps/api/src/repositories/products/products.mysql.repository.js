// apps/api/src/repositories/products/products.mysql.repository.js
const db = require("../../db/knex");

/**
 * Helpers
 */
function safeParseJSON(v) {
  if (v === null || v === undefined) return [];

  // knex/mysql puede devolver JSON como string o como objeto
  if (Array.isArray(v)) return v;
  if (typeof v === "object") return v;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

function isProbablyUrl(s) {
  const v = String(s || "").trim();
  return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:");
}

function toUrl(x) {
  if (!x) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "object") return String(x.url || "").trim();
  return String(x).trim();
}

function normalizeGallery(v) {
  const parsed = safeParseJSON(v);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(toUrl)
    .map((s) => String(s || "").trim())
    .filter((s) => s && isProbablyUrl(s)); // ✅ filtra "[object Object]" y basura
}

function normalizeSpecs(v) {
  const parsed = safeParseJSON(v);
  return Array.isArray(parsed) ? parsed : [];
}

function rowToProduct(row) {
  if (!row) return null;

  return {
    id: String(row.id),

    // legacy
    name: row.name ?? "",

    category: row.category ?? "General",
    priceUSD: Number(row.price_usd),
    stock: Number(row.stock),

    // i18n
    nameES: row.name_es ?? null,
    nameEN: row.name_en ?? null,
    shortDescES: row.short_desc_es ?? null,
    shortDescEN: row.short_desc_en ?? null,

    // specs
    specs: normalizeSpecs(row.specs_json),

    // images
    imageUrl: row.image_url ?? null,
    imagePublicId: row.image_public_id ?? null,

    // gallery can be stringified JSON or JSON type
    gallery: normalizeGallery(row.gallery_json),
  };
}

function toInsertUpdateRow(product) {
  const specs = Array.isArray(product?.specs) ? product.specs : [];

  // gallery puede venir como [string] o [{url, publicId}]
  const galleryRaw = Array.isArray(product?.gallery) ? product.gallery : [];
  const gallery = galleryRaw.map(toUrl).filter((s) => s && isProbablyUrl(s));

  return {
    // legacy name (si no viene, intenta derivar de nameES/nameEN)
    name: String(
      (product?.name && String(product.name).trim()) ||
        (product?.nameES && String(product.nameES).trim()) ||
        (product?.nameEN && String(product.nameEN).trim()) ||
        ""
    ).trim(),

    category: String(product?.category ?? "General").trim(),
    price_usd: Number(product?.priceUSD ?? 0),
    stock: Number(product?.stock ?? 0),

    // i18n
    name_es: product?.nameES ?? null,
    name_en: product?.nameEN ?? null,
    short_desc_es: product?.shortDescES ?? null,
    short_desc_en: product?.shortDescEN ?? null,

    // json
    specs_json: JSON.stringify(specs),
    gallery_json: JSON.stringify(gallery),

    // images
    image_url: product?.imageUrl ?? null,
    image_public_id: product?.imagePublicId ?? null,
  };
}

/**
 * Repository (Class style, consistent with Payments)
 */
class MySQLProductsRepository {
  constructor() {
    this.table = "products";
  }

  async findAll() {
    const rows = await db(this.table).select("*").orderBy("id", "asc");
    return rows.map(rowToProduct);
  }

  async findById(id) {
    const row = await db(this.table).where({ id }).first();
    return rowToProduct(row);
  }

  async create(product) {
    const insertRow = toInsertUpdateRow(product);

    const result = await db(this.table).insert(insertRow);
    const newId = Array.isArray(result) ? result[0] : result;

    const created = await db(this.table).where({ id: newId }).first();
    return rowToProduct(created);
  }

  async update(id, product) {
    const updateRow = toInsertUpdateRow(product);

    const affected = await db(this.table).where({ id }).update(updateRow);
    if (!affected) return null;

    const updated = await db(this.table).where({ id }).first();
    return rowToProduct(updated);
  }

  async delete(id) {
    const existing = await db(this.table).where({ id }).first();
    if (!existing) return null;

    await db(this.table).where({ id }).del();
    return rowToProduct(existing);
  }
}

module.exports = { MySQLProductsRepository };