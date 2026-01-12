/**
 * InMemoryCartRepository
 *
 * In-memory implementation of the CartRepository contract.
 * Used for unit tests and development.
 */
class InMemoryCartRepository {
  constructor() {
    this.cartsById = new Map();
  }

  /**
   * Persists a new cart.
   * @param {Object} cart - The cart object (must include cartId)
   * @returns {Promise<{cartId: string}>}
   */
  async create(cart) {
    const cartId = cart.cartId;
    this.cartsById.set(cartId, cart);
    return { cartId };
  }

  /**
   * Finds a cart by its ID.
   * @param {string} cartId
   * @returns {Promise<Object|null>}
   */
  async findById(cartId) {
    const cart = this.cartsById.get(cartId);
    return cart || null;
  }

  /**
   * Overwrites an existing cart with new state.
   * @param {Object} cart - The updated cart object
   * @returns {Promise<void>}
   */
  async save(cart) {
    const cartId = cart.cartId;
    this.cartsById.set(cartId, cart);
  }

  /**
   * Removes a cart by its ID.
   * @param {string} cartId
   * @returns {Promise<void>}
   */
  async delete(cartId) {
    this.cartsById.delete(cartId);
  }
}

module.exports = { InMemoryCartRepository };
