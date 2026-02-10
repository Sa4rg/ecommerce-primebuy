const crypto = require("crypto");
const { AppError } = require("../utils/errors");
const { CheckoutStatus } = require("../constants/checkoutStatus");
const {
  InMemoryCheckoutRepository,
} = require("../repositories/checkout/checkout.memory.repository");

const defaultCartService = require("./cart.service");
const defaultProductsService = require("./products.service");

/**
 * Adapter to wrap a raw Map as a repository-like interface.
 * Used for backward compatibility when deps.checkoutsStore is provided.
 */
function createMapAdapter(map) {
  return {
    async create(checkout) {
      map.set(checkout.checkoutId, checkout);
      return { checkoutId: checkout.checkoutId };
    },
    async findById(checkoutId) {
      return map.get(checkoutId) || null;
    },
    async save(checkout) {
      map.set(checkout.checkoutId, checkout);
    },
    async findPendingByCartId(cartId) {
      for (const checkout of map.values()) {
        if (checkout.cartId === cartId && checkout.status === "pending") {
          return checkout;
        }
      }
      return null;
    },
  };
}

function createCheckoutService(deps = {}) {
  const cartService = deps.cartService || defaultCartService;
  const productsService = deps.productsService || defaultProductsService;
  const idGenerator = deps.idGenerator || (() => crypto.randomUUID());

  // Support both new repository pattern and legacy checkoutsStore
  let checkoutRepository;
  if (deps.checkoutRepository) {
    checkoutRepository = deps.checkoutRepository;
  } else if (deps.checkoutsStore) {
    checkoutRepository = createMapAdapter(deps.checkoutsStore);
  } else {
    checkoutRepository = new InMemoryCheckoutRepository();
  }

  async function createCheckout(cartId, userId) {
      if (!userId || typeof userId !== "string") {
    throw new AppError("Unauthorized", 401);
    }

    // Idempotency: return existing pending checkout if exists
    const existingCheckout = await checkoutRepository.findPendingByCartId(cartId);
    if (existingCheckout) {
      return existingCheckout;
    }

    // Claim cart or forbid if owned by someone else
    const cart = await cartService.assignCartToUser(cartId, userId);

    if (cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    if (cart.metadata.status !== "active") {
      throw new AppError("Cart is not active", 409);
    }

    for (const item of cart.items) {
      const product = await productsService.getProductById(item.productId);

      if (!product.inStock || product.stock <= 0 || item.quantity > product.stock) {
        throw new AppError("Insufficient stock", 409);
      }
    }

    const items = cart.items.map(i => ({
      productId: i.productId,
      name: i.name,
      unitPriceUSD: i.unitPriceUSD,
      quantity: i.quantity,
      lineTotalUSD: i.lineTotalUSD,
    }));

    const subtotalUSD = cart.summary.subtotalUSD;
    let subtotalVES = null;
    let exchangeRate = null;

    const usdToVes = cart.metadata.exchangeRate?.usdToVes;
    const asOf = cart.metadata.exchangeRate?.asOf;

    if (typeof usdToVes === "number" && usdToVes > 0 && typeof asOf === "string" && asOf.length > 0) {
      subtotalVES = subtotalUSD * usdToVes;
      exchangeRate = {
        provider: "BCV",
        usdToVes,
        asOf,
      };
    }

    const paymentMethods = {
      usd: ["zelle", "zinli"],
      ves: ["bank_transfer", "pago_movil"],
    };

    const checkoutId = idGenerator();
    const now = new Date().toISOString();

    const checkout = {
      checkoutId,
      cartId,
      status: CheckoutStatus.PENDING, 
      items,
      totals: {
        subtotalUSD,
        subtotalVES,
      },
      exchangeRate,
      paymentMethods,
      createdAt: now,
      updatedAt: now,
    };

    await checkoutRepository.create(checkout);

    return checkout;
  }

  /**
   * Internal method for service-to-service calls.
   * Does NOT validate ownership - use getCheckoutById for external/controller calls.
   */
  async function findById(checkoutId) {
    const checkout = await checkoutRepository.findById(checkoutId);
    if (!checkout) {
      throw new AppError("Checkout not found", 404);
    }
    return checkout;
  }

  async function getCheckoutById(checkoutId, userId) {
    if (!userId || typeof userId !== "string") {
      throw new AppError("Unauthorized", 401);
    }

    const checkout = await checkoutRepository.findById(checkoutId);
    if (!checkout) {
      throw new AppError("Checkout not found", 404);
    }

    // ownership: el checkout pertenece al dueño del cart
    const cart = await cartService.getCart(checkout.cartId);

    // Si el cart aún fuese anónimo, NO deberías permitir ver checkout
    if (!cart.userId) {
      throw new AppError("Forbidden", 403);
    }

    if (cart.userId !== userId) {
      throw new AppError("Forbidden", 403);
    }

    return checkout;
  }

  return { createCheckout, findById, getCheckoutById };
}

const checkoutService = createCheckoutService();

module.exports = checkoutService;
module.exports.createCheckoutService = createCheckoutService;
