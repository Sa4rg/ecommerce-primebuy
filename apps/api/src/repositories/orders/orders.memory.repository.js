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

  /**
   * Find order by payment ID
   * @param {string} paymentId
   * @returns {Promise<Object|null>}
   */
  async findByPaymentId(paymentId) {
    for (const order of this.ordersById.values()) {
      if (order.paymentId === paymentId) {
        return order;
      }
    }
    return null;
  }

  /**
   * Find all orders for a specific user
   * @param {string} userId
   * @returns {Promise<Object[]>}
   */
  async findByUserId(userId) {
    const orders = [];
    for (const order of this.ordersById.values()) {
      if (order.userId === userId) {
        orders.push(order);
      }
    }
    return orders;
  }

  /**
 * Returns the most recent shipping address snapshot for a user.
 * If no previous order with a non-pickup address exists, returns null.
 * @param {string} userId
 * @returns {Promise<null|{method:string|null,recipientName:string|null,phone:string|null,state:string|null,city:string|null,line1:string|null,reference:string|null,fromOrderId:string,createdAt:string}>}
 */
  async findLastShippingAddressByUserId(userId) {
    const orders = await this.findByUserId(userId);
    if (!orders || orders.length === 0) return null;

    // findByUserId in memory does NOT guarantee order, so sort by createdAt desc
    const sorted = [...orders].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });

    const last = sorted[0];

    if (last.shipping?.method === "pickup") return null;

    const addr = last.shipping?.address;
    if (!addr) return null;

    const hasAny =
      addr.recipientName ||
      addr.phone ||
      addr.state ||
      addr.city ||
      addr.line1 ||
      addr.reference;

    if (!hasAny) return null;

    return {
      method: last.shipping?.method ?? null,
      recipientName: addr.recipientName ?? null,
      phone: addr.phone ?? null,
      state: addr.state ?? null,
      city: addr.city ?? null,
      line1: addr.line1 ?? null,
      reference: addr.reference ?? null,
      fromOrderId: last.orderId,
      createdAt: last.createdAt,
    };
  }
}

module.exports = { InMemoryOrdersRepository };
