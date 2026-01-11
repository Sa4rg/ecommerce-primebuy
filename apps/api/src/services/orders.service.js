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

  function nextUpdatedAt(previousUpdatedAt) {
    const next = new Date().toISOString();
    if (next !== previousUpdatedAt) return next;
    return new Date(Date.parse(previousUpdatedAt) + 1).toISOString();
  }

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

  async function processOrder(orderId) {
    const order = ordersStore.get(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.status !== "created") {
      throw new AppError("Order cannot be processed", 409);
    }

    order.status = "processing";
    order.updatedAt = nextUpdatedAt(order.updatedAt);

    return order;
  }

  async function completeOrder(orderId) {
    const order = ordersStore.get(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (!["created", "processing"].includes(order.status)) {
      throw new AppError("Order cannot be completed", 409);
    }

    order.status = "completed";
    order.updatedAt = nextUpdatedAt(order.updatedAt);

    return order;
  }

  async function cancelOrder(orderId, reason) {
    const order = ordersStore.get(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw new AppError("Invalid cancellation reason", 400);
    }

    if (order.status === "completed" || order.status === "cancelled") {
      throw new AppError("Order cannot be cancelled", 409);
    }

    order.status = "cancelled";
    order.cancellation = { reason: reason.trim() };
    order.updatedAt = nextUpdatedAt(order.updatedAt);

    return order;
  }

  return {
    createOrderFromPayment,
    getOrderById,
    processOrder,
    completeOrder,
    cancelOrder,
  };
}

const ordersService = createOrdersService();

module.exports = ordersService;
module.exports.createOrdersService = createOrdersService;
