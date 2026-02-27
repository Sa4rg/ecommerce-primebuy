/**
 * ProductsRepository Contract
 *
 * This file defines the expected interface for any ProductsRepository implementation.
 * It serves as documentation-by-code and does NOT contain runtime logic.
 *
 * Implementations:
 * - InMemoryProductsRepository (for unit tests)
 * - MySQL Products Repository (for production / integration tests)
 */

/**
 * @typedef {Object} ProductSpec
 * @property {string} [labelES]
 * @property {string} [valueES]
 * @property {string} [labelEN]
 * @property {string} [valueEN]
 */

/**
 * @typedef {Object} Product
 * @property {string} id - Unique identifier (always a string)
 *
 * // Legacy / base fields
 * @property {string} name - Product name (legacy / fallback)
 * @property {number} priceUSD - Price in USD
 * @property {number} stock - Available stock quantity
 * @property {string} category - Product category
 *
 * // i18n optional fields
 * @property {string|null} [nameES]
 * @property {string|null} [nameEN]
 * @property {string|null} [shortDescES]
 * @property {string|null} [shortDescEN]
 *
 * // specs optional
 * @property {ProductSpec[]} [specs]
 */

/**
 * @typedef {Object} ProductData
 * // Legacy / base fields (required by older tests)
 * @property {string} name
 * @property {number} priceUSD
 * @property {number} stock
 * @property {string} category
 *
 * // i18n (optional)
 * @property {string} [nameES]
 * @property {string} [nameEN]
 * @property {string} [shortDescES]
 * @property {string} [shortDescEN]
 *
 * // specs (optional)
 * @property {ProductSpec[]} [specs]
 */

/**
 * @typedef {Object} ProductsRepositoryContract
 *
 * @property {function(): Promise<Product[]>} findAll
 * Returns all persisted products in CREATION ORDER (oldest first).
 * NOTE: MySQL implementation MUST use ORDER BY id ASC to preserve this order.
 *
 * @property {function(string): Promise<Product|null>} findById
 * Returns a product by its ID, or null if not found.
 *
 * @property {function(ProductData): Promise<Product>} create
 * Persists a new product and returns it with a generated string ID.
 *
 * @property {function(string, ProductData): Promise<Product|null>} update
 * Updates an existing product by ID. Returns the updated product, or null if not found.
 *
 * @property {function(string): Promise<Product|null>} delete
 * Deletes a product by ID. Returns the deleted product, or null if not found.
 */

/**
 * Contract Rules:
 *
 * 1. IDs are ALWAYS strings (input and output).
 * 2. Methods return plain product objects.
 * 3. findById, update, delete return null when product does not exist.
 * 4. No business validation in repositories.
 * 5. No AppError usage in repositories.
 * 6. Repositories are persistence-only (no domain rules).
 */

module.exports = {};