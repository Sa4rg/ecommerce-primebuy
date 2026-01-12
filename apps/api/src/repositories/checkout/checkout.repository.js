/**
 * CheckoutRepository Contract
 *
 * This file defines the expected interface for any CheckoutRepository implementation.
 * It serves as documentation-by-code and does NOT contain runtime logic.
 *
 * Implementations:
 * - InMemoryCheckoutRepository (for unit tests)
 * - MySQLCheckoutRepository (for production / integration tests) [future]
 */

/**
 * @typedef {Object} CheckoutTotals
 * @property {number} subtotalUSD - Subtotal in USD
 * @property {number|null} subtotalVES - Subtotal in VES (if exchange rate available)
 */

/**
 * @typedef {Object} CheckoutExchangeRate
 * @property {string} provider - Exchange rate provider (e.g., "BCV")
 * @property {number} usdToVes - USD to VES exchange rate
 * @property {string} asOf - ISO timestamp of exchange rate
 */

/**
 * @typedef {Object} CheckoutPaymentMethods
 * @property {string[]} usd - Payment methods available for USD
 * @property {string[]} ves - Payment methods available for VES
 */

/**
 * @typedef {Object} Checkout
 * @property {string} checkoutId - Unique checkout identifier (always a string)
 * @property {string} cartId - Associated cart identifier
 * @property {CheckoutTotals} totals - Checkout totals
 * @property {CheckoutExchangeRate|null} exchangeRate - Exchange rate info (if applicable)
 * @property {CheckoutPaymentMethods} paymentMethods - Available payment methods
 */

/**
 * @typedef {Object} CheckoutRepositoryContract
 *
 * @property {function(Checkout): Promise<{checkoutId: string}>} create
 * Persists a new checkout and returns { checkoutId }.
 * The checkout object must include checkoutId already assigned by the service.
 *
 * @property {function(string): Promise<Checkout|null>} findById
 * Returns a checkout by its checkoutId, or null if not found.
 * - checkoutId: string
 *
 * @property {function(Checkout): Promise<void>} save
 * Overwrites an existing checkout with new state.
 * The checkout must already exist in the repository.
 */

/**
 * Contract Rules:
 *
 * 1. checkoutId is ALWAYS a string.
 * 2. findById returns null when checkout does not exist (no errors).
 * 3. No AppError usage in repositories.
 * 4. No business validation in repositories.
 * 5. Repositories are persistence-only (no domain rules).
 */

module.exports = {};
