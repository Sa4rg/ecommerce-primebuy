/**
 * CartRepository Contract
 *
 * This file defines the expected interface for any CartRepository implementation.
 * It serves as documentation-by-code and does NOT contain runtime logic.
 *
 * Implementations:
 * - InMemoryCartRepository (for unit tests)
 * - MySQLCartRepository (for production / integration tests) [future]
 */

/**
 * @typedef {Object} CartItem
 * @property {string} productId - Product identifier
 * @property {string} productName - Product name at time of adding
 * @property {number} unitPriceUSD - Unit price in USD
 * @property {number} quantity - Quantity in cart
 * @property {number} lineTotalUSD - unitPriceUSD * quantity
 */

/**
 * @typedef {Object} CartSummary
 * @property {number} itemsCount - Total number of items
 * @property {number} subtotalUSD - Subtotal in USD
 */

/**
 * @typedef {Object} CartMetadata
 * @property {string} market - Market code (e.g., "VE")
 * @property {string} baseCurrency - Base currency (e.g., "USD")
 * @property {string} displayCurrency - Display currency (e.g., "USD", "VES")
 * @property {Object} exchangeRate - Exchange rate info
 * @property {Object} tax - Tax configuration
 * @property {Object} customer - Customer info
 * @property {string} status - Cart status ("active", "checked_out")
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} Cart
 * @property {string} cartId - Unique cart identifier (always a string)
 * @property {CartItem[]} items - Array of cart items
 * @property {CartSummary} summary - Cart summary
 * @property {CartMetadata} metadata - Cart metadata
 */

/**
 * @typedef {Object} CartRepositoryContract
 *
 * @property {function(Cart): Promise<{cartId: string}>} create
 * Persists a new cart and returns { cartId }.
 * The cart object must include cartId already assigned by the service.
 *
 * @property {function(string): Promise<Cart|null>} findById
 * Returns a cart by its cartId, or null if not found.
 * - cartId: string
 *
 * @property {function(Cart): Promise<void>} save
 * Overwrites an existing cart with new state (e.g., after adding items).
 * The cart must already exist in the repository.
 *
 * @property {function(string): Promise<void>} delete
 * Removes a cart by cartId. No-op if cart does not exist.
 * - cartId: string
 */

/**
 * Contract Rules:
 *
 * 1. cartId is ALWAYS a string.
 * 2. findById returns null when cart does not exist (no errors).
 * 3. No AppError usage in repositories.
 * 4. No business validation in repositories.
 * 5. Repositories are persistence-only (no domain rules).
 * 6. No timestamp generation in repositories (handled by service).
 */

module.exports = {};
