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
const { createUsersRepository } = require("./factories/users/users.factory");
const { createRefreshTokensRepository } = require("./factories/refreshTokens.repository.factory");
const { createPasswordResetRequestsRepository } = require("./factories/passwordResetRequests.repository.factory");


// ============================================================================
// SERVICE FACTORIES
// ============================================================================
const { createProductsService } = require("../services/products.service");
const { createCartService } = require("../services/cart.service");
const { createCheckoutService } = require("../services/checkout.service");
const { createPaymentsService } = require("../services/payments.service");
const { createOrdersService } = require("../services/orders.service");
const { createAuthService } = require("../services/auth.service");
const { createPasswordResetService } = require("../services/passwordReset.service");
const emailService = require("../services/email.service");

// ============================================================================
// DEPENDENCY WIRING
// ============================================================================

// Repositories
const productsRepository = createProductsRepository(SEED_PRODUCTS);
const cartRepository = createCartRepository();
const checkoutRepository = createCheckoutRepository();
const paymentsRepository = createPaymentsRepository();
const ordersRepository = createOrdersRepository();
const usersRepository = createUsersRepository();
const refreshTokensRepository = createRefreshTokensRepository();
const passwordResetRequestsRepository = createPasswordResetRequestsRepository();


// Services
const productsService = createProductsService({ productsRepository });

const cartService = createCartService({ productsService, cartRepository });

const checkoutService = createCheckoutService({
  cartService,
  productsService,
  checkoutRepository,
  paymentsRepository,
});

const paymentsService = createPaymentsService({
  cartService,
  checkoutService,
  paymentsRepository,
});

const ordersService = createOrdersService({
  cartService,
  checkoutService,
  paymentsService,
  ordersRepository,
  productsService, // ✅ IMPORTANT: for stock decrement on confirm
});

// Lazy injection to avoid circular dependency
paymentsService.setOrdersService(ordersService);

const authService = createAuthService({ usersRepository, refreshTokensRepository, passwordResetRequestsRepository });

const passwordResetService = createPasswordResetService({
  usersRepository,
  passwordResetRequestsRepository,
  emailService,
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
    authService,
    passwordResetService,
  },
};
