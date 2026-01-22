/**
 * MySQLCheckoutRepository
 * 
 * MySQL implementation of CheckoutRepository contract.
 * Uses Knex for database operations.
 * 
 * Contract:
 * - create(checkout) -> { checkoutId }
 * - findById(checkoutId) -> Checkout|null
 * 
 * Rules:
 * - IDs remain strings (input and output)
 * - No business validation (persistence only)
 * - Timestamps managed internally (not exposed to domain)
 * - No AppError usage
 */

const db = require('../../db/knex');
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require('../../utils/datetime');

class MySQLCheckoutRepository {
  constructor() {
    this.table = 'checkouts';
  }

  /**
   * Map checkout to DB format
   * @private
   */
  _mapToDbFormat(checkout) {
    const now = new Date().toISOString();
    
    return {
      checkout_id: checkout.checkoutId,
      cart_id: checkout.cartId,
      totals_json: JSON.stringify(checkout.totals),
      exchange_rate_json: checkout.exchangeRate ? JSON.stringify(checkout.exchangeRate) : null,
      payment_methods_json: JSON.stringify(checkout.paymentMethods),
      status: checkout.status || 'pending',
      created_at: isoToMySQLDatetime(checkout.createdAt || now),
      updated_at: isoToMySQLDatetime(checkout.updatedAt || now),
    };
  }

  /**
   * Map DB row to checkout object
   * @private
   */
  _mapToCheckout(row) {
    if (!row) return null;
    
    const totals = typeof row.totals_json === 'string'
      ? JSON.parse(row.totals_json)
      : row.totals_json;
    
    let exchangeRate = null;
    if (row.exchange_rate_json !== null) {
      exchangeRate = typeof row.exchange_rate_json === 'string'
        ? JSON.parse(row.exchange_rate_json)
        : row.exchange_rate_json;
    }
    
    const paymentMethods = typeof row.payment_methods_json === 'string'
      ? JSON.parse(row.payment_methods_json)
      : row.payment_methods_json;
    
    return {
      checkoutId: row.checkout_id,
      cartId: row.cart_id,
      totals,
      exchangeRate,
      paymentMethods,
      createdAt: mysqlDatetimeToISO(row.created_at),
      updatedAt: mysqlDatetimeToISO(row.updated_at),
      status: row.status,
    };
  }

  /**
   * Persists a new checkout
   * @param {Object} checkout
   * @returns {Promise<{checkoutId: string}>}
   */
  async create(checkout) {
    const dbData = this._mapToDbFormat(checkout);
    await db(this.table).insert(dbData);
    return { checkoutId: checkout.checkoutId };
  }

  /**
   * Finds checkout by ID
   * @param {string} checkoutId
   * @returns {Promise<Object|null>}
   */
  async findById(checkoutId) {
    const row = await db(this.table)
      .where({ checkout_id: checkoutId })
      .first();
    
    return this._mapToCheckout(row);
  }
}

module.exports = { MySQLCheckoutRepository };
