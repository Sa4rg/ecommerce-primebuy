const crypto = require("crypto");
const { AppError } = require("../utils/errors");

// Default dependency (used by the app)
const defaultProductsService = require("./products.service");

function createCartService(deps = {}) {
  const productsService = deps.productsService || defaultProductsService;
  const cartsStore = deps.cartsStore || new Map();
  const idGenerator = deps.idGenerator || (() => crypto.randomUUID());

  async function createCart() {
    const cartId = idGenerator();
    const now = new Date().toISOString();
    const cart = {
      cartId,
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
      metadata: {
        market: "VE",
        baseCurrency: "USD",
        displayCurrency: "USD",
        exchangeRate: {
          provider: "BCV",
          usdToVes: null,
          asOf: null,
        },
        tax: {
          priceIncludesVAT: true,
          vatRate: 0.16,
        },
        customer: {
          email: null,
          name: null,
          phone: null,
        },
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    };

    cartsStore.set(cartId, cart);
    return { cartId };
  }

  async function getCart(cartId) {
    if (!cartsStore.has(cartId)) {
      throw new AppError("Cart not found", 404);
    }
    return cartsStore.get(cartId);
  }

  function validateQuantity(quantity) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError("Invalid quantity", 400);
    }
  }

  function recalcSummary(cart) {
    cart.summary.itemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.summary.subtotalUSD = cart.items.reduce((sum, item) => sum + item.lineTotalUSD, 0);
  }

  function nextUpdatedAt(previousUpdatedAt) {
    const next = new Date().toISOString();
    if (next !== previousUpdatedAt) return next;

    return new Date(Date.parse(previousUpdatedAt) + 1).toISOString();
  }

  function assertCartIsActive(cart) {
    if (cart.metadata?.status !== "active") {
      throw new AppError("Cart is not active", 409);
    }
  }

  async function addItem(cartId, productId, quantity) {
    if (!cartsStore.has(cartId)) {
      throw new AppError("Cart not found", 404);
    }

    const cart = cartsStore.get(cartId);
    assertCartIsActive(cart);

    validateQuantity(quantity);

    const product = await productsService.getProductById(productId);

    const existingItem = cart.items.find((item) => item.productId === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantity + quantity;

    if (!product.inStock || product.stock <= 0 || newQuantity > product.stock) {
      throw new AppError("Insufficient stock", 409);
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
      existingItem.lineTotalUSD = existingItem.unitPriceUSD * newQuantity;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        unitPriceUSD: product.priceUSD,
        quantity: newQuantity,
        lineTotalUSD: product.priceUSD * newQuantity,
      });
    }

    recalcSummary(cart);
    return cart;
  }

  async function updateItem(cartId, productId, quantity) {
    const cart = cartsStore.get(cartId);
    if (!cart) throw new AppError("Cart not found", 404);

    assertCartIsActive(cart);

    validateQuantity(quantity);

    const existingItem = cart.items.find((item) => item.productId === productId);
    if (!existingItem) throw new AppError("Item not found in cart", 404);

    const product = await productsService.getProductById(productId);
    if (!product.inStock || product.stock <= 0 || quantity > product.stock) {
      throw new AppError("Insufficient stock", 409);
    }

    existingItem.quantity = quantity;
    existingItem.lineTotalUSD = existingItem.unitPriceUSD * quantity;

    recalcSummary(cart);
    return cart;
}


  async function removeItem(cartId, productId) {
   const cart = cartsStore.get(cartId);
    if (!cart) throw new AppError("Cart not found", 404);

    assertCartIsActive(cart);

    const exists = cart.items.some(i => i.productId === productId);
    if (!exists) throw new AppError("Item not found in cart", 404);

    cart.items = cart.items.filter(i => i.productId !== productId);

    recalcSummary(cart);
    return cart;

  }

  function validateMetadataPatch(patch, currentMetadata) {
    // Validate displayCurrency
    if (patch.displayCurrency !== undefined) {
      if (!["USD", "VES"].includes(patch.displayCurrency)) {
        throw new AppError("Invalid cart metadata", 400);
      }
    }

    // Determine effective displayCurrency
    const effectiveDisplayCurrency = patch.displayCurrency ?? currentMetadata.displayCurrency;

    // Validate exchangeRate if displayCurrency is VES
    if (effectiveDisplayCurrency === "VES") {
      const exchangeRate = { ...currentMetadata.exchangeRate, ...patch.exchangeRate };
      if (!exchangeRate.usdToVes || exchangeRate.usdToVes <= 0 || !exchangeRate.asOf) {
        throw new AppError("Invalid cart metadata", 400);
      }
    }

    // Validate status
    if (patch.status !== undefined) {
      if (!["active", "locked", "checked_out"].includes(patch.status)) {
        throw new AppError("Invalid cart metadata", 400);
      }
    }

    // Validate customer.email if provided
    if (patch.customer?.email !== undefined) {
      if (typeof patch.customer.email !== 'string' || patch.customer.email.trim() === '' || !patch.customer.email.includes('@')) {
        throw new AppError("Invalid cart metadata", 400);
      }
    }
  }

  async function updateMetadata(cartId, patch) {
    const cart = cartsStore.get(cartId);
    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    // Validate patch
    validateMetadataPatch(patch, cart.metadata);

    // Apply controlled merge (whitelist)
    if (patch.displayCurrency !== undefined) {
      cart.metadata.displayCurrency = patch.displayCurrency;
    }
    if (patch.status !== undefined) {
      cart.metadata.status = patch.status;
    }
    if (patch.exchangeRate?.usdToVes !== undefined) {
      cart.metadata.exchangeRate.usdToVes = patch.exchangeRate.usdToVes;
    }
    if (patch.exchangeRate?.asOf !== undefined) {
      cart.metadata.exchangeRate.asOf = patch.exchangeRate.asOf;
    }
    if (patch.customer?.email !== undefined) {
      cart.metadata.customer.email = patch.customer.email;
    }
    if (patch.customer?.name !== undefined) {
      cart.metadata.customer.name = patch.customer.name;
    }
    if (patch.customer?.phone !== undefined) {
      cart.metadata.customer.phone = patch.customer.phone;
    }

    // Update updatedAt
    cart.metadata.updatedAt = nextUpdatedAt(cart.metadata.updatedAt);

    return cart;
  }

  return { createCart, getCart, addItem, updateItem, removeItem, updateMetadata };
}

// Default instance for the application (backward compatible)
const cartService = createCartService();

// Keep old behavior: requiring this module returns the service object
module.exports = cartService;

// Expose factory for tests / future wiring
module.exports.createCartService = createCartService;
