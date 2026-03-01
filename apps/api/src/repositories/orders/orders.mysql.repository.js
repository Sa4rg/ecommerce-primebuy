/**
 * MySQLOrdersRepository
 * 
 * MySQL implementation of OrdersRepository contract.
 * Uses Knex for database operations with transactions.
 * 
 * Contract:
 * - create(order) -> { orderId }
 * - findById(orderId) -> Order|null
 * - save(order) -> void
 * - findAll() -> Order[] (TEMPORARY for existing duplicate check)
 * 
 * Rules:
 * - IDs remain strings (input and output)
 * - No business validation (persistence only)
 * - No timestamp generation (comes from domain)
 * - No AppError usage
 */

const db = require('../../db/knex');
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require('../../utils/datetime');

class MySQLOrdersRepository {
  constructor() {
    this.ordersTable = 'orders';
    this.itemsTable = 'order_items';
    this.customerTable = 'order_customer';
    this.taxTable = 'order_tax';
    this.shippingTable = 'order_shipping';
  }

  /**
   * Map order object to orders table format
   * @private
   */
  _mapOrderToDbFormat(order) {
    return {
      order_id: order.orderId,
      user_id: order.userId,
      cart_id: order.cartId,
      checkout_id: order.checkoutId,
      payment_id: order.paymentId,
      status: order.status,
      subtotal_usd: order.totals.subtotalUSD,
      subtotal_ves: order.totals.subtotalVES,
      currency: order.totals.currency,
      amount_paid: order.totals.amountPaid,
      exchange_provider: order.exchangeRate?.provider || null,
      exchange_usd_to_ves: order.exchangeRate?.usdToVes || null,
      exchange_as_of: order.exchangeRate?.asOf || null,
      payment_method: order.payment.method,
      payment_proof_reference: order.payment.proof?.reference || null,
      payment_review_note: order.payment.review?.note || null,
      payment_review_reason: order.payment.review?.reason || null,
      created_at: isoToMySQLDatetime(order.createdAt),
      updated_at: isoToMySQLDatetime(order.updatedAt),
    };
  }

  /**
   * Map order items to order_items table format
   * @private
   */
  _mapItemsToDbFormat(orderId, items) {
    return items.map(item => ({
      order_id: orderId,
      product_id: item.productId,
      name: item.name,
      unit_price_usd: item.unitPriceUSD,
      quantity: item.quantity,
      line_total_usd: item.lineTotalUSD,
    }));
  }

  /**
   * Map customer to order_customer table format
   * @private
   */
  _mapCustomerToDbFormat(orderId, customer) {
    return {
      order_id: orderId,
      email: customer.email || null,
      name: customer.name || null,
      phone: customer.phone || null,
    };
  }

  /**
   * Map tax to order_tax table format
   * @private
   */
  _mapTaxToDbFormat(orderId, tax) {
    return {
      order_id: orderId,
      price_includes_vat: tax.priceIncludesVAT,
      vat_rate: tax.vatRate,
    };
  }

  /**
   * Map shipping to order_shipping table format
   * @private
   */
  _mapShippingToDbFormat(orderId, shipping) {
    const address = shipping.address;
    return {
      order_id: orderId,
      method: shipping.method || null,
      status: shipping.status,
      address_recipient_name: address?.recipientName || null,
      address_phone: address?.phone || null,
      address_state: address?.state || null,
      address_city: address?.city || null,
      address_line1: address?.line1 || null,
      address_reference: address?.reference || null,
      carrier_name: shipping.carrier?.name || null,
      carrier_tracking_number: shipping.carrier?.trackingNumber || null,
      dispatched_at: shipping.dispatchedAt ? isoToMySQLDatetime(shipping.dispatchedAt) : null,
      delivered_at: shipping.deliveredAt ? isoToMySQLDatetime(shipping.deliveredAt) : null,
    };
  }

  /**
   * Map DB rows to Order object
   * @private
   */
  _mapDbRowsToOrder(orderRow, items, customer, tax, shipping) {
    if (!orderRow) return null;

    // Map exchange rate
    let exchangeRate = null;
    if (orderRow.exchange_provider) {
      exchangeRate = {
        provider: orderRow.exchange_provider,
        usdToVes: parseFloat(orderRow.exchange_usd_to_ves),
        asOf: orderRow.exchange_as_of,
      };
    }

    // Map payment proof
    let proof = null;
    if (orderRow.payment_proof_reference) {
      proof = { reference: orderRow.payment_proof_reference };
    }

    // Map payment review
    let review = undefined;
    if (orderRow.payment_review_note || orderRow.payment_review_reason) {
      review = {};
      if (orderRow.payment_review_note) review.note = orderRow.payment_review_note;
      if (orderRow.payment_review_reason) review.reason = orderRow.payment_review_reason;
    }

    // Map shipping address
    let address = null;
    if (shipping.method && shipping.method !== "pickup") {
      address = {
        recipientName: shipping.address_recipient_name,
        phone: shipping.address_phone,
        state: shipping.address_state,
        city: shipping.address_city,
        line1: shipping.address_line1,
        reference: shipping.address_reference,
      };
    }

    // Map shipping carrier (always return object)
    const carrier = {
      name: shipping.carrier_name || null,
      trackingNumber: shipping.carrier_tracking_number || null,
    };

    return {
      orderId: String(orderRow.order_id),
      userId: orderRow.user_id ? String(orderRow.user_id) : null,
      cartId: String(orderRow.cart_id),
      checkoutId: String(orderRow.checkout_id),
      paymentId: String(orderRow.payment_id),
      status: orderRow.status,
      items: items.map(item => ({
        productId: String(item.product_id),
        name: item.name,
        quantity: item.quantity,
        unitPriceUSD: parseFloat(item.unit_price_usd),
        lineTotalUSD: parseFloat(item.line_total_usd),
      })),
      totals: {
        subtotalUSD: parseFloat(orderRow.subtotal_usd),
        subtotalVES: orderRow.subtotal_ves ? parseFloat(orderRow.subtotal_ves) : null,
        currency: orderRow.currency,
        amountPaid: parseFloat(orderRow.amount_paid),
      },
      exchangeRate,
      tax: {
        priceIncludesVAT: tax.price_includes_vat === 1 || tax.price_includes_vat === true,
        vatRate: parseFloat(tax.vat_rate),
      },
      customer: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      },
      payment: {
        method: orderRow.payment_method,
        proof,
        review,
      },
      shipping: {
        method: shipping.method,
        address,
        carrier,
        status: shipping.status,
        dispatchedAt: shipping.dispatched_at ? mysqlDatetimeToISO(shipping.dispatched_at) : null,
        deliveredAt: shipping.delivered_at ? mysqlDatetimeToISO(shipping.delivered_at) : null,
      },
      createdAt: mysqlDatetimeToISO(orderRow.created_at),
      updatedAt: mysqlDatetimeToISO(orderRow.updated_at),
    };
  }

  /**
   * Persists a new order with all snapshots
   * @param {Object} order
   * @returns {Promise<{orderId: string}>}
   */
  async create(order) {
    await db.transaction(async (trx) => {
      // Insert main order
      await trx(this.ordersTable).insert(this._mapOrderToDbFormat(order));

      // Insert items
      if (order.items && order.items.length > 0) {
        await trx(this.itemsTable).insert(this._mapItemsToDbFormat(order.orderId, order.items));
      }

      // Insert customer snapshot
      await trx(this.customerTable).insert(this._mapCustomerToDbFormat(order.orderId, order.customer));

      // Insert tax snapshot
      await trx(this.taxTable).insert(this._mapTaxToDbFormat(order.orderId, order.tax));

      // Insert shipping snapshot
      await trx(this.shippingTable).insert(this._mapShippingToDbFormat(order.orderId, order.shipping));
    });

    return { orderId: order.orderId };
  }

  /**
   * Finds order by ID with all snapshots
   * @param {string} orderId
   * @returns {Promise<Object|null>}
   */
  async findById(orderId) {
    const orderRow = await db(this.ordersTable)
      .where({ order_id: orderId })
      .first();

    if (!orderRow) return null;

    const [items, customer, tax, shipping] = await Promise.all([
      db(this.itemsTable).where({ order_id: orderId }).select('*'),
      db(this.customerTable).where({ order_id: orderId }).first(),
      db(this.taxTable).where({ order_id: orderId }).first(),
      db(this.shippingTable).where({ order_id: orderId }).first(),
    ]);

    return this._mapDbRowsToOrder(orderRow, items, customer, tax, shipping);
  }

  /**
   * Updates existing order with all snapshots
   * @param {Object} order
   * @returns {Promise<void>}
   */
  async save(order) {
    await db.transaction(async (trx) => {
      // Update main order
      await trx(this.ordersTable)
        .where({ order_id: order.orderId })
        .update(this._mapOrderToDbFormat(order));

      // Delete and re-insert items (idempotent)
      await trx(this.itemsTable).where({ order_id: order.orderId }).delete();
      if (order.items && order.items.length > 0) {
        await trx(this.itemsTable).insert(this._mapItemsToDbFormat(order.orderId, order.items));
      }

      // Update customer snapshot
      await trx(this.customerTable)
        .where({ order_id: order.orderId })
        .update(this._mapCustomerToDbFormat(order.orderId, order.customer));

      // Update tax snapshot
      await trx(this.taxTable)
        .where({ order_id: order.orderId })
        .update(this._mapTaxToDbFormat(order.orderId, order.tax));

      // Update shipping snapshot
      await trx(this.shippingTable)
        .where({ order_id: order.orderId })
        .update(this._mapShippingToDbFormat(order.orderId, order.shipping));
    });
  }

  /**
   * Returns all orders
   * TEMPORARY: Used by orders.service for duplicate check
   * @returns {Promise<Array<Object>>}
   */
  async findAll() {
    const orderRows = await db(this.ordersTable)
      .select('*')
      .orderBy('created_at', 'asc');

    const orders = [];
    for (const orderRow of orderRows) {
      const order = await this.findById(orderRow.order_id);
      if (order) orders.push(order);
    }

    return orders;
  }

  /**
   * Find order by payment ID
   * @param {string} paymentId
   * @returns {Promise<Object|null>}
   */
  async findByPaymentId(paymentId) {
    const orderRow = await db(this.ordersTable)
      .where({ payment_id: paymentId })
      .first();

    if (!orderRow) return null;
    return this.findById(orderRow.order_id);
  }

  /**
   * Find all orders for a specific user
   * @param {string} userId
   * @returns {Promise<Object[]>}
   */
  async findByUserId(userId) {
    const orderRows = await db(this.ordersTable)
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    const orders = [];
    for (const orderRow of orderRows) {
      const order = await this.findById(orderRow.order_id);
      if (order) orders.push(order);
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
    const row = await db("orders as o")
      .leftJoin("order_shipping as s", "s.order_id", "o.order_id")
      .select([
        "o.order_id",
        "o.created_at",
        "s.method",
        "s.address_recipient_name",
        "s.address_phone",
        "s.address_state",
        "s.address_city",
        "s.address_line1",
        "s.address_reference",
      ])
      .where("o.user_id", userId)
      .orderBy("o.created_at", "desc")
      .first();

    if (!row) return null;

    // Rule: most recent order is pickup => null
    if (row.method === "pickup") return null;

    const hasAny =
      row.address_recipient_name ||
      row.address_phone ||
      row.address_state ||
      row.address_city ||
      row.address_line1 ||
      row.address_reference;

    if (!hasAny) return null;

    return {
      method: row.method || null,
      recipientName: row.address_recipient_name || null,
      phone: row.address_phone || null,
      state: row.address_state || null,
      city: row.address_city || null,
      line1: row.address_line1 || null,
      reference: row.address_reference || null,
      fromOrderId: String(row.order_id),
      createdAt: mysqlDatetimeToISO(row.created_at),
    };
  }
}

module.exports = { MySQLOrdersRepository };