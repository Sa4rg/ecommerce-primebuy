const crypto = require("crypto");
const { AppError } = require("../utils/errors");

const defaultCartService = require("./cart.service");
const defaultProductsService = require("./products.service");

function createCheckoutService(deps = {}) {
  const cartService = deps.cartService || defaultCartService;
  const productsService = deps.productsService || defaultProductsService;
  const checkoutsStore = deps.checkoutsStore || new Map();
  const idGenerator = deps.idGenerator || (() => crypto.randomUUID());

  async function createCheckout(cartId) {
    const cart = await cartService.getCart(cartId);

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

    const checkout = {
      checkoutId,
      cartId,
      totals: {
        subtotalUSD,
        subtotalVES,
      },
      exchangeRate,
      paymentMethods,
    };

    checkoutsStore.set(checkoutId, checkout);

    return checkout;
  }

  async function getCheckoutById(checkoutId) {
    if (!checkoutsStore.has(checkoutId)) {
      throw new AppError("Checkout not found", 404);
    }
    return checkoutsStore.get(checkoutId);
  }

  return { createCheckout, getCheckoutById };
}

const checkoutService = createCheckoutService();

module.exports = checkoutService;
module.exports.createCheckoutService = createCheckoutService;
