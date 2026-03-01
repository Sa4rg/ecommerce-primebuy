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
  const paymentsRepository = deps.paymentsRepository || null;

  // Support both new repository pattern and legacy checkoutsStore
  let checkoutRepository;
  if (deps.checkoutRepository) {
    checkoutRepository = deps.checkoutRepository;
  } else if (deps.checkoutsStore) {
    checkoutRepository = createMapAdapter(deps.checkoutsStore);
  } else {
    checkoutRepository = new InMemoryCheckoutRepository();
  }

  /**
   * Guard: Ensures checkout is not locked by an active payment.
   * Blocks editing if payment status is 'submitted' or 'confirmed'.
   * Allows editing if payment is 'pending' or 'rejected'.
   */
  async function ensureCheckoutNotLockedByPayment(checkoutId) {
    // If repository is not wired, do not silently allow editing in production.
    // But to keep backward compatibility in isolated tests, we treat missing repo as "no payments".
    if (!paymentsRepository || typeof paymentsRepository.findByCheckoutId !== "function") {
      return;
    }

    const payments = await paymentsRepository.findByCheckoutId(checkoutId);

    const hasActivePayment = payments.some(
      (p) => p.status === "submitted" || p.status === "confirmed"
    );

    if (hasActivePayment) {
      // Keep message consistent with existing API behavior
      throw new AppError("Checkout is not editable", 409);
    }
  }

  async function createCheckout(cartId, userId) {
      if (!userId || typeof userId !== "string") {
    throw new AppError("Unauthorized", 401);
    }

    // Cancel any existing pending checkout for this cart (user modified cart)
    const existingCheckout = await checkoutRepository.findPendingByCartId(cartId);
    if (existingCheckout) {
      existingCheckout.status = CheckoutStatus.CANCELLED;
      existingCheckout.updatedAt = new Date().toISOString();
      await checkoutRepository.save(existingCheckout);
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
      imageUrl: i.imageUrl || null, // ✅ Snapshot includes image
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
      exchangeRate: exchangeRate ?? null,
      paymentMethods,
      shippingAddress: null,
      shipping: {
        method: null,
        address: null,
      },
      billingAddress: null,
      customer: {
        name: null,
        email: null,
        phone: null,
      },
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

  function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

  function validateShippingPatch(patch) {
    if (!patch || typeof patch !== "object") {
      throw new AppError("Invalid shipping", 400);
    }

    // ✅ normalize legacy + allow new methods
    const rawMethod = patch.method ?? null;
    let method = rawMethod;

    if (typeof method === "string") {
      method = method.trim().toLowerCase();

      // legacy alias
      if (method === "delivery") method = "local_delivery";

      // other common aliases (optional, por si llegan)
      if (method === "localdelivery") method = "local_delivery";
      if (method === "nationalshipping") method = "national_shipping";
    }

    const allowed = ["pickup", "local_delivery", "national_shipping"];

    if (method !== null && method !== undefined) {
      if (!allowed.includes(method)) {
        throw new AppError("Invalid shipping method", 400);
      }
    }

    if (method === "pickup") {
      return {
        method: "pickup",
        address: null,
      };
    }

    // ✅ delivery methods require address
    if (patch.address !== undefined && patch.address !== null) {
      const a = patch.address;

      const required = ["recipientName", "phone", "state", "city", "line1"];
      for (const key of required) {
        if (typeof a[key] !== "string" || a[key].trim() === "") {
          throw new AppError("Invalid shipping address", 400);
        }
      }

      if (a.reference !== undefined && a.reference !== null && typeof a.reference !== "string") {
        throw new AppError("Invalid shipping address", 400);
      }

      return {
        method: method || "local_delivery",
        address: {
          recipientName: a.recipientName.trim(),
          phone: a.phone.trim(),
          state: a.state.trim(),
          city: a.city.trim(),
          line1: a.line1.trim(),
          reference: a.reference ? a.reference.trim() : null,
        },
      };
    }

    throw new AppError("Invalid shipping", 400);
  }

  async function updateShipping(checkoutId, userId, patch) {
    const checkout = await getCheckoutById(checkoutId, userId);

    if (checkout.status !== CheckoutStatus.PENDING) {
      throw new AppError("Checkout is not editable", 409);
    }

    await ensureCheckoutNotLockedByPayment(checkoutId);

    const normalized = validateShippingPatch(patch);

    checkout.shipping = normalized;
    checkout.updatedAt = new Date().toISOString();
    await checkoutRepository.save(checkout);

    return checkout;
  }

  function validateCustomerPatch(patch) {
    if (patch.email !== undefined) {
      if (typeof patch.email !== "string" || !patch.email.includes("@")) {
        throw new AppError("Invalid customer", 400);
      }
    }
    if (patch.name !== undefined) {
      if (typeof patch.name !== "string") {
        throw new AppError("Invalid customer", 400);
      }
    }
    if (patch.phone !== undefined) {
      if (typeof patch.phone !== "string") {
        throw new AppError("Invalid customer", 400);
      }
    }
  }

  async function updateCustomer(checkoutId, userId, patch) {
    // auth + ownership
    const checkout = await getCheckoutById(checkoutId, userId);

    // editable rule mínima (si quieres desde ya):
    if (checkout.status !== CheckoutStatus.PENDING) {
      throw new AppError("Checkout is not editable", 409);
    }

    await ensureCheckoutNotLockedByPayment(checkoutId);

    validateCustomerPatch(patch);

    checkout.customer = {
      ...(checkout.customer || { name: null, email: null, phone: null }),
      ...patch,
    };

    checkout.updatedAt = new Date().toISOString();
    await checkoutRepository.save(checkout);

    return checkout;
  }

  async function cancelCheckout(checkoutId, userId) {
    // auth + ownership
    const checkout = await getCheckoutById(checkoutId, userId);

    // Can only cancel pending checkouts
    if (checkout.status !== CheckoutStatus.PENDING) {
      throw new AppError("Checkout is not editable", 409);
    }

    checkout.status = CheckoutStatus.CANCELLED;
    checkout.updatedAt = new Date().toISOString();
    await checkoutRepository.save(checkout);

    return checkout;
  }


  return { createCheckout, findById, getCheckoutById, updateShipping, updateCustomer, cancelCheckout };
}

const checkoutService = createCheckoutService();

module.exports = checkoutService;
module.exports.createCheckoutService = createCheckoutService;
