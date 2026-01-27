/**
 * InMemoryOrdersRepository
 *
 * In-memory implementation of the OrdersRepository contract.
 * Used for unit tests and development.
 * Stores references directly (no copies) to match Map behavior.
 */
class InMemoryOrdersRepository {
  constructor() {
    this.ordersById = new Map();
  }

  /**
   * Persists a new order.
   * @param {Object} order - The order object (must include orderId)
   * @returns {Promise<{orderId: string}>}
   * @throws {Error} if paymentId already exists (simulates UNIQUE constraint)
   */
  async create(order) {
    // Simulate UNIQUE constraint on payment_id
    for (const existingOrder of this.ordersById.values()) {
      if (existingOrder.paymentId === order.paymentId) {
        const error = new Error(`Duplicate entry '${order.paymentId}' for key 'orders_payment_id_unique'`);
        error.code = 'ER_DUP_ENTRY';
        error.sqlMessage = `Duplicate entry '${order.paymentId}' for key 'orders_payment_id_unique'`;
        throw error;
      }
    }

    const orderId = order.orderId;
    this.ordersById.set(orderId, order);
    return { orderId };
  }

  /**
   * Finds an order by its ID.
   * Returns the same reference (no copy) to match Map behavior.
   * @param {string} orderId
   * @returns {Promise<Object|null>}
   */
  async findById(orderId) {
    const order = this.ordersById.get(orderId);
    return order || null;
  }

  /**
   * Overwrites an existing order with new state.
   * @param {Object} order - The updated order object
   * @returns {Promise<void>}
   */
  async save(order) {
    const orderId = order.orderId;
    this.ordersById.set(orderId, order);
  }

  /**
   * Returns all orders.
   * @returns {Promise<Array<Object>>}
   */
  async findAll() {
    return Array.from(this.ordersById.values());
  }
}

module.exports = { InMemoryOrdersRepository };
