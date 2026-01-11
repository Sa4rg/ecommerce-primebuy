const crypto = require("crypto");
const { AppError } = require("../utils/errors");

const defaultCartService = require("./cart.service");
const defaultCheckoutService = require("./checkout.service");
const defaultPaymentsService = require("./payments.service");

const VALID_SHIPPING_METHODS = ["pickup", "local_delivery", "national_shipping"];
const VALID_CARRIER_NAMES = ["MRW", "ZOOM", "OTHER"];

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

  function getExistingOrder(orderId) {
    if (!ordersStore.has(orderId)) {
      throw new AppError("Order not found", 404);
    }
    return ordersStore.get(orderId);
  }

  function assertOrderEditableForShipping(order) {
    if (order.status === "completed" || order.status === "cancelled") {
      throw new AppError("Order cannot be updated for shipping", 409);
    }
  }

  function validateShippingDetails(details) {
    if (!details || typeof details !== "object") {
      throw new AppError("Invalid shipping details", 400);
    }

    if (!VALID_SHIPPING_METHODS.includes(details.method)) {
      throw new AppError("Invalid shipping details", 400);
    }

    if (details.method === "pickup") {
      // Address must be null or undefined for pickup
      if (details.address !== null && details.address !== undefined) {
        throw new AppError("Invalid shipping details", 400);
      }
    } else {
      // Address required for local_delivery and national_shipping
      if (!details.address || typeof details.address !== "object") {
        throw new AppError("Invalid shipping details", 400);
      }

      const requiredFields = ["recipientName", "phone", "state", "city", "line1"];
      for (const field of requiredFields) {
        const value = details.address[field];
        if (typeof value !== "string" || value.trim().length === 0) {
          throw new AppError("Invalid shipping details", 400);
        }
      }
    }
  }

  function normalizeAddress(address) {
    if (!address) return null;

    return {
      recipientName: address.recipientName.trim(),
      phone: address.phone.trim(),
      state: address.state.trim(),
      city: address.city.trim(),
      line1: address.line1.trim(),
      reference: address.reference ? address.reference.trim() : null,
    };
  }

  function validateCarrierForDispatch(order, carrier) {
    if (order.shipping.method === "national_shipping") {
      if (!carrier || typeof carrier !== "object") {
        throw new AppError("Invalid shipping carrier", 400);
      }

      if (!VALID_CARRIER_NAMES.includes(carrier.name)) {
        throw new AppError("Invalid shipping carrier", 400);
      }

      if (typeof carrier.trackingNumber !== "string" || carrier.trackingNumber.trim().length === 0) {
        throw new AppError("Invalid shipping carrier", 400);
      }
    }
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
      shipping: {
        method: null,
        address: null,
        carrier: { name: null, trackingNumber: null },
        status: "pending",
        dispatchedAt: null,
        deliveredAt: null,
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

  async function setShippingDetails(orderId, details) {
    const order = getExistingOrder(orderId);
    assertOrderEditableForShipping(order);
    validateShippingDetails(details);

    order.shipping.method = details.method;
    order.shipping.address = details.method === "pickup" ? null : normalizeAddress(details.address);
    order.updatedAt = nextUpdatedAt(order.updatedAt);

    return order;
  }

  async function markDispatched(orderId, carrier) {
    const order = getExistingOrder(orderId);
    assertOrderEditableForShipping(order);

    if (order.shipping.status !== "pending") {
      throw new AppError("Shipping cannot be dispatched", 409);
    }

    if (order.shipping.method === null) {
      throw new AppError("Invalid shipping details", 400);
    }

    if (["local_delivery", "national_shipping"].includes(order.shipping.method) && order.shipping.address === null) {
      throw new AppError("Invalid shipping details", 400);
    }

    validateCarrierForDispatch(order, carrier);

    order.shipping.status = "dispatched";
    order.shipping.dispatchedAt = new Date().toISOString();

    if (order.shipping.method === "national_shipping" && carrier) {
      order.shipping.carrier = {
        name: carrier.name,
        trackingNumber: carrier.trackingNumber.trim(),
      };
    }

    order.updatedAt = nextUpdatedAt(order.updatedAt);

    return order;
  }

  async function markDelivered(orderId) {
    const order = getExistingOrder(orderId);
    assertOrderEditableForShipping(order);

    if (order.shipping.status !== "dispatched") {
      throw new AppError("Shipping cannot be delivered", 409);
    }

    order.shipping.status = "delivered";
    order.shipping.deliveredAt = new Date().toISOString();
    order.status = "completed";
    order.updatedAt = nextUpdatedAt(order.updatedAt);

    return order;
  }

  return {
    createOrderFromPayment,
    getOrderById,
    processOrder,
    completeOrder,
    cancelOrder,
    setShippingDetails,
    markDispatched,
    markDelivered,
  };
}

const ordersService = createOrdersService();

module.exports = ordersService;
module.exports.createOrdersService = createOrdersService;
