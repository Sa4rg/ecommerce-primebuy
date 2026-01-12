/**
 * ProductsRepository Contract
 *
 * This file defines the expected interface for any ProductsRepository implementation.
 * It serves as documentation-by-code and does NOT contain runtime logic.
 *
 * Implementations:
 * - InMemoryProductsRepository (for unit tests)
 * - MySQLProductsRepository (for production / integration tests) [future]
 */

/**
 * @typedef {Object} Product
 * @property {string} id - Unique identifier (always a string)
 * @property {string} name - Product name
 * @property {number} priceUSD - Price in USD
 * @property {number} stock - Available stock quantity
 * @property {string} category - Product category
 */

/**
 * @typedef {Object} ProductData
 * @property {string} name - Product name
 * @property {number} priceUSD - Price in USD
 * @property {number} stock - Available stock quantity
 * @property {string} category - Product category
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
 * - id: string
 *
 * @property {function(ProductData): Promise<Product>} create
 * Persists a new product and returns it with a generated string ID.
 * - productData: { name, priceUSD, stock, category }
 *
 * @property {function(string, ProductData): Promise<Product|null>} update
 * Updates an existing product by ID. Returns the updated product, or null if not found.
 * - id: string
 * - productData: partial product fields to update
 *
 * @property {function(string): Promise<Product|null>} delete
 * Deletes a product by ID. Returns the deleted product, or null if not found.
 * - id: string
 */

/**
 * Contract Rules:
 *
 * 1. IDs are ALWAYS strings (input and output).
 * 2. Methods return plain product objects: { id, name, priceUSD, stock, category }
 * 3. findById, update, delete return null when product does not exist.
 * 4. No business validation in repositories.
 * 5. No AppError usage in repositories.
 * 6. Repositories are persistence-only (no domain rules).
 */

module.exports = {};
