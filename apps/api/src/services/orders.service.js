const crypto = require("crypto");
const { AppError } = require("../utils/errors");

const defaultCartService = require("./cart.service");
const defaultCheckoutService = require("./checkout.service");
const defaultPaymentsService = require("./payments.service");

function createOrdersService(deps = {}) {
  const cartService = deps.cartService || defaultCartService;
  const checkoutService = deps.checkoutService || defaultCheckoutService;
  const paymentsService = deps.paymentsService || defaultPaymentsService;
  const ordersStore = deps.ordersStore || new Map();
  const idGenerator = deps.idGenerator || (() => crypto.randomUUID());

  async function getOrderById(orderId) {
    if (!ordersStore.has(orderId)) {
      throw new AppError("Order not found", 404);
    }
    return ordersStore.get(orderId);
  }

  async function createOrderFromPayment(paymentId) {
    // 1) Load payment
    const payment = await paymentsService.getPaymentById(paymentId);

    // 2) Validate payment is confirmed
    if (payment.status !== "confirmed") {
      throw new AppError("Payment is not confirmed", 409);
    }

    // 3) Prevent duplicates
    for (const order of ordersStore.values()) {
      if (order.paymentId === paymentId) {
        throw new AppError("Order already exists for payment", 409);
      }
    }

    // 4) Load checkout
    const checkout = await checkoutService.getCheckoutById(payment.checkoutId);

    // 5) Load cart
    const cart = await cartService.getCart(checkout.cartId);

    // 6) Build order snapshot
    const orderId = idGenerator();
    const now = new Date().toISOString();

    const order = {
      orderId,
      cartId: cart.cartId,
      checkoutId: checkout.checkoutId,
      paymentId: payment.paymentId,
      status: "created",
      items: cart.items.map((item) => ({ ...item })),
      totals: {
        subtotalUSD: checkout.totals.subtotalUSD,
        subtotalVES: checkout.totals.subtotalVES,
        currency: payment.currency,
        amountPaid: payment.amount,
      },
      exchangeRate: checkout.exchangeRate,
      tax: cart.metadata.tax,
      customer: cart.metadata.customer,
      payment: {
        method: payment.method,
        proof: payment.proof,
        review: payment.review,
      },
      createdAt: now,
      updatedAt: now,
    };

    // 7) Finalize cart
    await cartService.updateMetadata(cart.cartId, { status: "checked_out" });

    // 8) Persist
    ordersStore.set(orderId, order);

    return order;
  }

  return { createOrderFromPayment, getOrderById };
}

const ordersService = createOrdersService();

module.exports = ordersService;
module.exports.createOrdersService = createOrdersService;
