/**
 * InMemoryCheckoutRepository
 *
 * In-memory implementation of the CheckoutRepository contract.
 * Used for unit tests and development.
 * Stores references directly (no copies) to match Map behavior.
 */
class InMemoryCheckoutRepository {
  constructor() {
    this.checkoutsById = new Map();
  }

  /**
   * Persists a new checkout.
   * @param {Object} checkout - The checkout object (must include checkoutId)
   * @returns {Promise<{checkoutId: string}>}
   */
  async create(checkout) {
    const checkoutId = checkout.checkoutId;
    this.checkoutsById.set(checkoutId, checkout);
    return { checkoutId };
  }

  /**
   * Finds a checkout by its ID.
   * Returns the same reference (no copy) to match Map behavior.
   * @param {string} checkoutId
   * @returns {Promise<Object|null>}
   */
  async findById(checkoutId) {
    const checkout = this.checkoutsById.get(checkoutId);
    return checkout || null;
  }

  /**
   * Overwrites an existing checkout with new state.
   * @param {Object} checkout - The updated checkout object
   * @returns {Promise<void>}
   */
  async save(checkout) {
    const checkoutId = checkout.checkoutId;
    this.checkoutsById.set(checkoutId, checkout);
  }

  /**
   * Finds a pending checkout by cartId.
   * @param {string} cartId
   * @returns {Promise<Object|null>}
   */
  async findPendingByCartId(cartId) {
    for (const checkout of this.checkoutsById.values()) {
      if (checkout.cartId === cartId && checkout.status === "pending") {
        return checkout;
      }
    }
    return null;
  }
}

module.exports = { InMemoryCheckoutRepository };
