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
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require('../../utils/datetime');

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
      cart_secret: cart.cartSecret || null,
      user_id: cart.userId,
      status: cart.metadata.status,
      metadata_json: JSON.stringify(cart.metadata),
      created_at: isoToMySQLDatetime(cart.metadata.createdAt),
      updated_at: isoToMySQLDatetime(cart.metadata.updatedAt),
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
      name: item.name,
      unit_price_usd: item.unitPriceUSD,
      quantity: item.quantity,
      line_total_usd: item.lineTotalUSD,
      image_url: item.imageUrl || null, // ✅ Persist image URL
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
      name: item.name,
      unitPriceUSD: parseFloat(item.unit_price_usd),
      quantity: item.quantity,
      lineTotalUSD: parseFloat(item.line_total_usd),
      imageUrl: item.image_url || null, // ✅ Load image URL
    }));

    // Calculate summary from items
    const summary = {
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalUSD: items.reduce((sum, item) => sum + item.lineTotalUSD, 0),
    };

    return {
      cartId: cartRow.cart_id,
      cartSecret: cartRow.cart_secret || null,
      userId: cartRow.user_id,
      items,
      summary,
      metadata: {
        ...metadata,
        createdAt: mysqlDatetimeToISO(cartRow.created_at),
        updatedAt: mysqlDatetimeToISO(cartRow.updated_at),
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

  /**
   * Finds the active cart for a user.
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findActiveByUserId(userId) {
    const cartRow = await db(this.cartsTable)
      .where({ user_id: userId, status: 'active' })
      .first();

    if (!cartRow) {
      return null;
    }

    const itemRows = await db(this.itemsTable)
      .where({ cart_id: cartRow.cart_id })
      .select('*');

    return this._mapDbToCart(cartRow, itemRows);
  }
}

module.exports = { MySQLCartRepository };
