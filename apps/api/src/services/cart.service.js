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
    const cart = {
      cartId,
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
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

  async function addItem(cartId, productId, quantity) {
    if (!cartsStore.has(cartId)) {
      throw new AppError("Cart not found", 404);
    }

    validateQuantity(quantity);

    const product = await productsService.getProductById(productId);

    const cart = cartsStore.get(cartId);

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
  // 1) Validate cart exists
  const cart = cartsStore.get(cartId);
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  // 2) Validate quantity
  validateQuantity(quantity); 

  // 3) Validate item exists in cart
  const existingItem = cart.items.find((item) => item.productId === productId);
  if (!existingItem) {
    throw new AppError("Item not found in cart", 404);
  }

  // 4) Validate stock (need product stock from productsService)
  const product = await productsService.getProductById(productId);
    if (!product.inStock || product.stock <= 0 || quantity > product.stock) {
      throw new AppError("Insufficient stock", 409);
    }

  // 5) Update item
  existingItem.quantity = quantity;
  existingItem.lineTotalUSD = existingItem.unitPriceUSD * quantity;

  // 6) Recalculate summary
  recalcSummary(cart);
  return cart;
}


  return { createCart, getCart, addItem, updateItem };
}

// Default instance for the application (backward compatible)
const cartService = createCartService();

// Keep old behavior: requiring this module returns the service object
module.exports = cartService;

// Expose factory for tests / future wiring
module.exports.createCartService = createCartService;
