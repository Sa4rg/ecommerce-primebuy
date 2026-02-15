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

  /**
   * Finds all payments for a given checkout.
   * @param {string} checkoutId
   * @returns {Promise<Object[]>}
   */
  async findByCheckoutId(checkoutId) {
    const payments = [];
    for (const payment of this.paymentsById.values()) {
      if (payment.checkoutId === checkoutId) {
        payments.push(payment);
      }
    }
    return payments;
  }

  /**
   * Finds all payments, optionally filtered by status.
   * @param {Object} filters - Optional filters { status: string }
   * @returns {Promise<Object[]>}
   */
  async findAll(filters = {}) {
    const payments = [];
    for (const payment of this.paymentsById.values()) {
      if (filters.status && payment.status !== filters.status) {
        continue;
      }
      payments.push(payment);
    }
    return payments;
  }

  /**
   * Finds all payments for a specific user
   * @param {string} userId
   * @returns {Promise<Object[]>}
   */
  async findByUserId(userId) {
    const payments = [];
    for (const payment of this.paymentsById.values()) {
      if (payment.userId === userId) {
        payments.push(payment);
      }
    }
    return payments;
  }
}

module.exports = { InMemoryPaymentsRepository };
