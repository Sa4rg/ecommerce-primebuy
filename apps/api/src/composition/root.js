/**
 * Composition Root
 *
 * Central place where all dependencies are wired together.
 * Instantiates repositories and services using their factories,
 * ensuring a single shared instance graph.
 *
 * Benefits:
 * - Single source of truth for dependency wiring
 * - Easier to swap implementations (e.g., in-memory → MySQL)
 * - Explicit dependency graph
 * - No circular dependencies
 */

// Initial seed data for backward compatibility with existing tests
const SEED_PRODUCTS = [
  { name: "Laptop", priceUSD: 1000, stock: 10, category: "Electronics" },
  { name: "Mouse", priceUSD: 20, stock: 50, category: "Electronics" },
  { name: "Keyboard", priceUSD: 50, stock: 30, category: "Electronics" },
  { name: "USB Cable", priceUSD: 5, stock: 0, category: "Electronics" },
];

// Repository imports
const { InMemoryCheckoutRepository } = require("../repositories/checkout/checkout.memory.repository");
// Products, Payments, Cart and Orders repositories are created via factory (supports MySQL for integration tests)
const { createProductsRepository } = require("./factories/products.repository.factory");
const { createPaymentsRepository } = require("./factories/payments.repository.factory");
const { createCartRepository } = require("./factories/cart.repository.factory");
const { createOrdersRepository } = require("./factories/orders.repository.factory");

// Service factory imports
const { createProductsService } = require("../services/products.service");
const { createCartService } = require("../services/cart.service");
const { createCheckoutService } = require("../services/checkout.service");
const { createPaymentsService } = require("../services/payments.service");
const { createOrdersService } = require("../services/orders.service");

// 1. Instantiate repositories
const productsRepository = createProductsRepository(SEED_PRODUCTS);
const cartRepository = createCartRepository();
const checkoutRepository = new InMemoryCheckoutRepository();
const paymentsRepository = createPaymentsRepository();
// Orders repository: Uses factory to select implementation based on environment
const ordersRepository = createOrdersRepository();

// 2. Instantiate services with explicit dependencies
const productsService = createProductsService({
  productsRepository,
});

const cartService = createCartService({
  productsService,
  cartRepository,
});

const checkoutService = createCheckoutService({
  cartService,
  productsService,
  checkoutRepository,
});

const paymentsService = createPaymentsService({
  checkoutService,
  paymentsRepository,
});

const ordersService = createOrdersService({
  cartService,
  checkoutService,
  paymentsService,
  ordersRepository,
});

// 3. Export container
module.exports = {
  services: {
    productsService,
    cartService,
    checkoutService,
    paymentsService,
    ordersService,
  },
};
