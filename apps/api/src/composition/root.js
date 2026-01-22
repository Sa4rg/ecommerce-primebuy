/**
 * Composition Root
 *
 * Central place where all dependencies are wired together.
 * Creates repositories via factories and injects them into services.
 *
 * Structure:
 * 1. Seed data (InMemory only)
 * 2. Repository factories
 * 3. Service factories
 * 4. Wire dependencies
 * 5. Export services container
 *
 * NOTE: Factories decide InMemory vs MySQL based on environment.
 * This module only wires the dependency graph.
 */

// ============================================================================
// SEED DATA (for InMemory repositories only)
// ============================================================================
const SEED_PRODUCTS = [
  { name: "Laptop", priceUSD: 1000, stock: 10, category: "Electronics" },
  { name: "Mouse", priceUSD: 20, stock: 50, category: "Electronics" },
  { name: "Keyboard", priceUSD: 50, stock: 30, category: "Electronics" },
  { name: "USB Cable", priceUSD: 5, stock: 0, category: "Electronics" },
];

// ============================================================================
// REPOSITORY FACTORIES
// ============================================================================
const { createProductsRepository } = require("./factories/products.repository.factory");
const { createPaymentsRepository } = require("./factories/payments.repository.factory");
const { createCartRepository } = require("./factories/cart.repository.factory");
const { createCheckoutRepository } = require("./factories/checkout.repository.factory");
const { createOrdersRepository } = require("./factories/orders.repository.factory");

// ============================================================================
// SERVICE FACTORIES
// ============================================================================
const { createProductsService } = require("../services/products.service");
const { createCartService } = require("../services/cart.service");
const { createCheckoutService } = require("../services/checkout.service");
const { createPaymentsService } = require("../services/payments.service");
const { createOrdersService } = require("../services/orders.service");

// ============================================================================
// DEPENDENCY WIRING
// ============================================================================

// Repositories (factories decide implementation based on environment)
const productsRepository = createProductsRepository(SEED_PRODUCTS);
const cartRepository = createCartRepository();
const checkoutRepository = createCheckoutRepository();
const paymentsRepository = createPaymentsRepository();
const ordersRepository = createOrdersRepository();

// Services (explicitly injected dependencies)
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

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  services: {
    productsService,
    cartService,
    checkoutService,
    paymentsService,
    ordersService,
  },
};
