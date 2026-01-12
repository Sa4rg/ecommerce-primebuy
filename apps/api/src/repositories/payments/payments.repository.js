/**
 * PaymentsRepository Contract
 *
 * This file defines the expected interface for any PaymentsRepository implementation.
 * It serves as documentation-by-code and does NOT contain runtime logic.
 *
 * Implementations:
 * - InMemoryPaymentsRepository (for unit tests)
 * - MySQLPaymentsRepository (for production / integration tests) [future]
 */

/**
 * @typedef {Object} PaymentProof
 * @property {string} reference - Payment reference/transaction ID
 * @property {string} [date] - Payment date (optional)
 * @property {string} [note] - Additional notes (optional)
 */

/**
 * @typedef {Object} PaymentReview
 * @property {string|null} [note] - Admin confirmation note (for confirmed payments)
 * @property {string} [reason] - Admin rejection reason (for rejected payments)
 */

/**
 * @typedef {Object} Payment
 * @property {string} paymentId - Unique payment identifier (always a string)
 * @property {string} checkoutId - Associated checkout identifier
 * @property {string} method - Payment method (e.g., "zelle", "zinli", "pago_movil", "bank_transfer")
 * @property {string} currency - Payment currency ("USD" or "VES")
 * @property {number} amount - Payment amount
 * @property {string} status - Payment status ("pending", "submitted", "confirmed", "rejected")
 * @property {PaymentProof|null} proof - Payment proof (null until submitted)
 * @property {PaymentReview} [review] - Admin review (present when confirmed/rejected)
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} PaymentsRepositoryContract
 *
 * @property {function(Payment): Promise<{paymentId: string}>} create
 * Persists a new payment and returns { paymentId }.
 * The payment object must include paymentId already assigned by the service.
 *
 * @property {function(string): Promise<Payment|null>} findById
 * Returns a payment by its paymentId, or null if not found.
 * - paymentId: string
 *
 * @property {function(Payment): Promise<void>} save
 * Overwrites an existing payment with new state (e.g., after status change).
 * save(payment) persists the current state (upsert allowed).
 */

/**
 * Contract Rules:
 *
 * 1. paymentId is ALWAYS a string.
 * 2. findById returns null when payment does not exist (no errors).
 * 3. No AppError usage in repositories.
 * 4. No business validation in repositories.
 * 5. Repositories are persistence-only (no domain rules).
 * 6. No timestamp generation in repositories (handled by service).
 */

module.exports = {};
