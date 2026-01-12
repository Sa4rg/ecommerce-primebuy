/**
 * InMemoryPaymentsRepository
 *
 * In-memory implementation of the PaymentsRepository contract.
 * Used for unit tests and development.
 * Stores references directly (no copies) to match Map behavior.
 */
class InMemoryPaymentsRepository {
  constructor() {
    this.paymentsById = new Map();
  }

  /**
   * Persists a new payment.
   * @param {Object} payment - The payment object (must include paymentId)
   * @returns {Promise<{paymentId: string}>}
   */
  async create(payment) {
    const paymentId = payment.paymentId;
    this.paymentsById.set(paymentId, payment);
    return { paymentId };
  }

  /**
   * Finds a payment by its ID.
   * Returns the same reference (no copy) to match Map behavior.
   * @param {string} paymentId
   * @returns {Promise<Object|null>}
   */
  async findById(paymentId) {
    const payment = this.paymentsById.get(paymentId);
    return payment || null;
  }

  /**
   * Overwrites an existing payment with new state.
   * @param {Object} payment - The updated payment object
   * @returns {Promise<void>}
   */
  async save(payment) {
    const paymentId = payment.paymentId;
    this.paymentsById.set(paymentId, payment);
  }
}

module.exports = { InMemoryPaymentsRepository };
