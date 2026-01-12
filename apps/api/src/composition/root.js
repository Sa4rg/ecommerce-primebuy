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

// Repository imports
const { InMemoryProductsRepository } = require("../repositories/products/products.memory.repository");
const { InMemoryCartRepository } = require("../repositories/cart/cart.memory.repository");
const { InMemoryCheckoutRepository } = require("../repositories/checkout/checkout.memory.repository");
const { InMemoryPaymentsRepository } = require("../repositories/payments/payments.memory.repository");
const { InMemoryOrdersRepository } = require("../repositories/orders/orders.memory.repository");

// Service factory imports
const productsServiceModule = require("../services/products.service");
const { createCartService } = require("../services/cart.service");
const { createCheckoutService } = require("../services/checkout.service");
const { createPaymentsService } = require("../services/payments.service");
const { createOrdersService } = require("../services/orders.service");

// 1. Instantiate repositories
// NOTE: productsRepository is NOT instantiated here because we reuse
// the default productsService instance for backward compatibility with
// tests that spy on the products.service module directly.
const cartRepository = new InMemoryCartRepository();
const checkoutRepository = new InMemoryCheckoutRepository();
const paymentsRepository = new InMemoryPaymentsRepository();
const ordersRepository = new InMemoryOrdersRepository();

// 2. Instantiate services with explicit dependencies
// NOTE: We must use factories and inject dependencies to ensure
// all services share the same repository instances.

// EXCEPTION: productsService uses the default export from products.service.js
// for backward compatibility with existing tests that spy on that module.
const productsService = productsServiceModule;

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
