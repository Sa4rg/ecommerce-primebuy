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

  /**
   * Finds the active cart for a user.
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findActiveByUserId(userId) {
    for (const cart of this.cartsById.values()) {
      if (cart.userId === userId && cart.metadata?.status === 'active') {
        return cart;
      }
    }
    return null;
  }
}

module.exports = { InMemoryCartRepository };
