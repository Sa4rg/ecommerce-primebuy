/**
 * MySQLCartRepository
 * 
 * MySQL implementation of CartRepository contract.
 * Uses Knex for database operations with transactions.
 * 
 * Contract:
 * - create(cart) -> { cartId }
 * - findById(cartId) -> Cart|null
 * - save(cart) -> void
 * 
 * Rules:
 * - IDs remain strings (input and output)
 * - No business validation (persistence only)
 * - No timestamp generation (comes from domain)
 * - No AppError usage
 */

const db = require('../../db/knex');

/**
 * Convert ISO 8601 string to MySQL DATETIME format
 * @param {string} isoString - ISO 8601 timestamp (e.g., "2026-01-21T10:00:00.000Z")
 * @returns {string} MySQL DATETIME format (e.g., "2026-01-21 10:00:00")
 */
function isoToMysqlDatetime(isoString) {
  return isoString.replace('T', ' ').substring(0, 19);
}

/**
 * Convert MySQL DATETIME to ISO 8601 string
 * @param {Date|string} mysqlDatetime - MySQL DATETIME value
 * @returns {string} ISO 8601 timestamp
 */
function mysqlDatetimeToIso(mysqlDatetime) {
  return new Date(mysqlDatetime).toISOString();
}

class MySQLCartRepository {
  constructor() {
    this.cartsTable = 'carts';
    this.itemsTable = 'cart_items';
  }

  /**
   * Map cart to carts table format
   * @private
   */
  _mapCartToDbFormat(cart) {
    return {
      cart_id: cart.cartId,
      status: cart.metadata.status,
      metadata_json: JSON.stringify(cart.metadata),
      created_at: isoToMysqlDatetime(cart.metadata.createdAt),
      updated_at: isoToMysqlDatetime(cart.metadata.updatedAt),
    };
  }

  /**
   * Map cart items to cart_items table format
   * @private
   */
  _mapItemsToDbFormat(cartId, items) {
    return items.map(item => ({
      cart_id: cartId,
      product_id: item.productId,
      name: item.productName,
      unit_price_usd: item.unitPriceUSD,
      quantity: item.quantity,
      line_total_usd: item.lineTotalUSD,
    }));
  }

  /**
   * Map database rows to cart domain object
   * @private
   */
  _mapDbToCart(cartRow, itemRows) {
    const metadata = typeof cartRow.metadata_json === 'string' 
      ? JSON.parse(cartRow.metadata_json)
      : cartRow.metadata_json;

    const items = itemRows.map(item => ({
      productId: item.product_id,
      productName: item.name,
      unitPriceUSD: parseFloat(item.unit_price_usd),
      quantity: item.quantity,
      lineTotalUSD: parseFloat(item.line_total_usd),
    }));

    // Calculate summary from items
    const summary = {
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalUSD: items.reduce((sum, item) => sum + item.lineTotalUSD, 0),
    };

    return {
      cartId: cartRow.cart_id,
      items,
      summary,
      metadata: {
        ...metadata,
        createdAt: mysqlDatetimeToIso(cartRow.created_at),
        updatedAt: mysqlDatetimeToIso(cartRow.updated_at),
      },
    };
  }

  /**
   * Persists a new cart
   * @param {Object} cart - The cart object (must include cartId)
   * @returns {Promise<{cartId: string}>}
   */
  async create(cart) {
    await db.transaction(async (trx) => {
      // Insert cart main record
      await trx(this.cartsTable).insert(this._mapCartToDbFormat(cart));

      // Insert cart items if any
      if (cart.items && cart.items.length > 0) {
        const items = this._mapItemsToDbFormat(cart.cartId, cart.items);
        await trx(this.itemsTable).insert(items);
      }
    });

    return { cartId: cart.cartId };
  }

  /**
   * Finds a cart by its ID
   * @param {string} cartId
   * @returns {Promise<Object|null>}
   */
  async findById(cartId) {
    const cartRow = await db(this.cartsTable)
      .where({ cart_id: cartId })
      .first();

    if (!cartRow) {
      return null;
    }

    const itemRows = await db(this.itemsTable)
      .where({ cart_id: cartId })
      .select('*');

    return this._mapDbToCart(cartRow, itemRows);
  }

  /**
   * Overwrites an existing cart with new state
   * @param {Object} cart - The updated cart object
   * @returns {Promise<void>}
   */
  async save(cart) {
    await db.transaction(async (trx) => {
      // Update cart main record
      await trx(this.cartsTable)
        .where({ cart_id: cart.cartId })
        .update(this._mapCartToDbFormat(cart));

      // Delete existing items and re-insert
      await trx(this.itemsTable)
        .where({ cart_id: cart.cartId })
        .del();

      if (cart.items && cart.items.length > 0) {
        const items = this._mapItemsToDbFormat(cart.cartId, cart.items);
        await trx(this.itemsTable).insert(items);
      }
    });
  }
}

module.exports = { MySQLCartRepository };
